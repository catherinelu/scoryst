from django import shortcuts, http
from scorystapp import models, decorators, raw_sql
from scorystapp.views import helpers
from scorystapp.performance import cache_helpers
import json
import numpy as np


@decorators.access_controlled
def report(request, cur_course_user):
  """ Renders the report page """
  return helpers.render(request, 'report.epy', {
    'title': 'Report',
    'is_student': cur_course_user.privilege == models.CourseUser.STUDENT
    })


@decorators.access_controlled
@decorators.submission_released_required
def get_all_assessment_statistics(request, cur_course_user):
  """ Returns statistics for the each assessment in the course """
  cur_course = cur_course_user.course
  is_student = cur_course_user.privilege == models.CourseUser.STUDENT

  if not is_student:
    assessment_set = models.Assessment.objects.filter(course=cur_course).order_by('id')
  else:
    submission_set = models.Submission.objects.filter(assessment__course=cur_course.pk,
      course_user=cur_course_user, last=True, released=True).order_by('assessment__id')
    assessment_set = [submission.assessment for submission in submission_set]

  statistics = []
  for assessment in assessment_set:
    if assessment.submission_set.count() > 0:
      statistics.append(_get_assessment_statistics(assessment, cur_course_user))
  return http.HttpResponse(json.dumps(statistics), mimetype='application/json')


@decorators.access_controlled
@decorators.submission_released_required
def get_question_statistics(request, cur_course_user, assessment_id):
  """ Returns statistics for the entire assessment and also for each question/part """
  assessment = shortcuts.get_object_or_404(models.Assessment, pk=assessment_id)
  statistics = _get_all_question_statistics(assessment, cur_course_user)

  return http.HttpResponse(json.dumps(statistics), mimetype='application/json')


@decorators.access_controlled
@decorators.submission_released_required
def get_histogram_for_assessment(request, cur_course_user, assessment_id):
  """ Fetches the histogram for the entire assessment """
  graded_submission_scores = models.Submission.objects.values_list(
    'points', flat=True).filter(graded=True, assessment=assessment_id, last=True)
  histogram = _get_histogram(graded_submission_scores)

  return http.HttpResponse(json.dumps(histogram), mimetype='application/json')


@decorators.access_controlled
@decorators.submission_released_required
def get_histogram_for_question(request, cur_course_user, assessment_id, question_number):
  """ Fetches the histogram for the given question_number for the assessment """
  assessment = shortcuts.get_object_or_404(models.Assessment, pk=assessment_id)
  submission_set = assessment.get_prefetched_submissions()

  question_number = int(question_number)

  question_parts = models.QuestionPart.objects.filter(assessment=assessment,
    question_number=question_number)
  num_question_parts = question_parts.count()

  graded_question_scores = raw_sql.get_graded_question_scores(submission_set,
    question_number, num_question_parts)

  histogram = _get_histogram(graded_question_scores)
  return http.HttpResponse(json.dumps(histogram), mimetype='application/json')


@decorators.access_controlled
@decorators.submission_released_required
def get_all_percentile_scores(request, cur_course_user):
  """ Returns the set of percentile scores for the course_user """
  data = _get_all_percentile_scores(cur_course_user)
  return http.HttpResponse(json.dumps(data), mimetype='application/json')


def _get_all_percentile_scores(course_user):
  """
  Returns a dictionary of the form:
  {
    'labels': 'assessment name 1', 'assessment name 2'...,
    'percentile': 'percentile in assessment 1', .....
  }
  """
  submission_set = models.Submission.objects.filter(assessment__course=course_user.course.pk,
    course_user=course_user, last=True, released=True, graded=True).order_by('assessment__id')
  assessment_set = [submission.assessment for submission in submission_set]

  labels = []
  percentiles = []
  for submission in submission_set:
    graded_submission_scores = models.Submission.objects.values_list(
      'points', flat=True).filter(graded=True, assessment=submission.assessment, last=True)
    percentile = _percentile(graded_submission_scores, submission.points)

    labels.append(submission.assessment.name)
    percentiles.append(percentile)

  return {
    'labels': labels,
    'percentiles': percentiles
  }


def _percentile(scores, student_score):
  """ Calculates percentile for the student_score """
  scores = np.array(sorted(scores))
  num_scores = len(scores)
  return round(sum(scores <= student_score) / float(num_scores) * 100, 2)


def _mean(scores, is_rounded=True):
  """ Calculates the mean among the scores """
  num_scores = len(scores)
  mean_score = sum(scores)/num_scores if num_scores else 0
  return round(mean_score, 2) if is_rounded else mean_score


def _median(scores):
  """ Calculates the median among the scores """
  num_scores = len(scores)
  sorted_scores = sorted(scores)

  # In case no scores are provided
  if num_scores == 0: return 0

  if num_scores % 2 == 0:
    median_score = (sorted_scores[num_scores/2 - 1] + sorted_scores[num_scores/2])/2
  else:
    median_score = sorted_scores[num_scores/2]
  return round(median_score, 2)


def _standard_deviation(scores):
  """ Calculates the standard deviation among scores """
  num_scores = len(scores)
  if num_scores == 0: return 0

  mean_score = _mean(scores, False)
  sum_x2 = sum(score**2 for score in scores)
  std_dev_score = (sum_x2/num_scores - mean_score ** 2) ** 0.5
  return round(std_dev_score, 2)


def _max(scores):
  """ Calculates the max among the scores """
  return max(scores) if len(scores) else 0


def _get_assessment_statistics(assessment, course_user):
  """
  Calculates the median, mean, max and standard deviation among all the assessments
  that have been graded.
  """
  graded_submission_scores = models.Submission.objects.values_list(
    'points', flat=True).filter(graded=True, assessment=assessment, last=True)

  if course_user.is_student():
    submission = shortcuts.get_object_or_404(models.Submission,
      assessment=assessment, course_user=course_user, last=True)
    student_score = submission.points if submission.graded else 'Ungraded'
  else:
    student_score = 'N/A'

  return {
    'name': assessment.name,
    'id': assessment.id,
    'median': _median(graded_submission_scores),
    'mean': _mean(graded_submission_scores),
    'max': _max(graded_submission_scores),
    'std_dev': _standard_deviation(graded_submission_scores),
    'student_score': student_score
  }


def _get_all_question_statistics(assessment, course_user):
  """
  Calculates the median, mean, max and standard deviation for all question_parts
  in the assessment
  """
  question_statistics = []
  submission_set = assessment.submission_set.all()
  question_parts = models.QuestionPart.objects.filter(
    assessment=assessment).order_by('question_number')

  if question_parts.count() > 0 and submission_set.count() > 0:
    num_questions = question_parts[question_parts.count() - 1].question_number

    for question_number in range(num_questions):
      stats = _get_question_statistics(assessment, submission_set, question_number + 1,
        question_parts, course_user)
      question_statistics.append(stats)

  return question_statistics


def _get_question_statistics(assessment, submission_set, question_number,
    question_parts, course_user):
  """
  Calculates the median, mean, max and standard deviation among all the assessments
  for which this question_number has been graded.
  Also calculates the same for each part for given question
  """
  question_parts = question_parts.filter(question_number=question_number)

  num_question_parts = question_parts.count()
  graded_question_scores = raw_sql.get_graded_question_scores(submission_set,
    question_number, num_question_parts)

  if course_user.is_student():
    submission = shortcuts.get_object_or_404(models.Submission,
      assessment=assessment, course_user=course_user, last=True)
    student_score = (submission.get_question_points(question_number) if
      submission.is_question_graded(question_number) else 'Ungraded')
  else:
    student_score = 'N/A'

  return {
    'assessment_id': submission_set[0].assessment.id,
    'question_number': question_number,
    'median': _median(graded_question_scores),
    'mean': _mean(graded_question_scores),
    'max': _max(graded_question_scores),
    'std_dev': _standard_deviation(graded_question_scores),
    'student_score': student_score
  }


def _get_histogram(scores):
  """
  Returns a histogram of the scores of the form {
    'range_1_start-range_1_end': number_1,
    'range_2_start-range_2_end': number_2,
  }
  """
  sorted_scores = sorted(scores)
  num_scores = len(scores)

  if num_scores == 0:
    return {
      'labels': ['0-0'],
      'histogram': [0]
    }
  max_score = sorted_scores[num_scores - 1]
  step_size = _get_step_size(max_score)

  bins = [0]
  curr = 0
  labels = []

  while curr < max_score:
    labels.append('[%d, %d)' % (curr, curr + step_size))
    curr += step_size
    bins.append(curr)
  # The last bin's upper score is inclusive, so change ) to ]
  if labels:
    labels[-1] = labels[-1][:-1] + ']'

  hist, bin_edges = np.histogram(scores, bins=bins)

  return {
    'labels': labels,
    'histogram': hist.tolist()
  }


def _get_step_size(max_score):
  """ Calculates the appropriate step size for our histogram. """
  if max_score > 1000:
    step_size = 200
  elif max_score > 500:
    step_size = 100
  elif max_score > 250:
    step_size = 50
  elif max_score > 100:
    step_size = 20
  elif max_score > 50:
    step_size = 10
  elif max_score > 20:
    step_size = 5
  elif max_score > 10:
    step_size = 2
  else:
    step_size = 1
  return step_size
