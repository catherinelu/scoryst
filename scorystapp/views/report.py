from django import shortcuts, http
from scorystapp import models, decorators, raw_sql
from scorystapp.views import helpers
from scorystapp.performance import cache_helpers
import json
import itertools
import numpy as np


@decorators.access_controlled
def report(request, cur_course_user, course_user_id=None):
  """
  Renders the report page. The `course_user_id` is passed in because the course staff
  might want to see the report page from a `course_user`s view
  """
  course_user = _validate_course_user_id(cur_course_user, course_user_id)

  if cur_course_user.is_staff():
    students = models.CourseUser.objects.filter(course=cur_course_user.course,
      privilege=models.CourseUser.STUDENT).order_by('user__first_name', 'user__last_name')
  else:
    students = None

  return helpers.render(request, 'report.epy', {
    'title': 'Report',
    'is_student': cur_course_user.privilege == models.CourseUser.STUDENT,
    'students': students,
    # If the staff is seeing a specific `course_user`s view, return the id of the
    # `course_user`, else just return 0
    'active_id': course_user.id if course_user.is_student() else 0
    })


@decorators.access_controlled
@decorators.submission_released_required
def get_all_assessment_statistics(request, cur_course_user, course_user_id=None):
  """ Returns statistics for the each assessment in the course """
  course_user = _validate_course_user_id(cur_course_user, course_user_id)
  cur_course = course_user.course

  if course_user.is_staff():
    assessment_set = models.Assessment.objects.filter(course=cur_course).order_by('id')
  else:
    submission_set = models.Submission.objects.filter(assessment__course=cur_course.pk,
      last=True, released=True, group_members=course_user).order_by('assessment__id')
    assessment_set = [submission.assessment for submission in submission_set]

  statistics = []
  for assessment in assessment_set:
    if assessment.submission_set.count() > 0:
      statistics.append(_get_assessment_statistics(assessment, course_user))
  return http.HttpResponse(json.dumps(statistics), mimetype='application/json')


@decorators.access_controlled
@decorators.submission_released_required
def get_question_statistics(request, cur_course_user, assessment_id, course_user_id=None):
  """ Returns statistics for the entire assessment and also for each question/part """
  course_user = _validate_course_user_id(cur_course_user, course_user_id)
  assessment = shortcuts.get_object_or_404(models.Assessment, pk=assessment_id)
  statistics = _get_all_question_statistics(assessment, course_user)

  return http.HttpResponse(json.dumps(statistics), mimetype='application/json')


@decorators.access_controlled
@decorators.submission_released_required
def get_histogram_for_assessment(request, cur_course_user, assessment_id):
  """ Fetches the histogram for the entire assessment """
  assessment = shortcuts.get_object_or_404(models.Assessment, pk=assessment_id)
  graded_submission_scores = _get_graded_submission_scores(assessment)
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
def get_all_percentile_scores(request, cur_course_user, course_user_id=None):
  """ Returns the set of percentile scores for the course_user """
  course_user = _validate_course_user_id(cur_course_user, course_user_id)

  data = _get_all_percentile_scores(course_user)
  return http.HttpResponse(json.dumps(data), mimetype='application/json')


def _merge_values(values):
  """
  When you call values() on a queryset where the Model has a ManyToManyField
  and there are multiple related items, it returns a separate dictionary for each
  related item. This function merges the dictionaries so that there is only
  one dictionary per id at the end, with lists of related items for each.

  https://gist.github.com/pamelafox-coursera/3707015
  """
  grouped_results = itertools.groupby(values, key=lambda value: value['id'])

  merged_values = []
  for k, g in grouped_results:

    groups = list(g)
    merged_value = {}
    for group in groups:
      for key, val in group.iteritems():
        if not merged_value.get(key):
          merged_value[key] = [val]
        elif val != merged_value[key]:
          if isinstance(merged_value[key], list):
            if val not in merged_value[key]:
              merged_value[key].append(val)
          else:
            print 'Should never reach here. TODO: Catherine read this and confirm'
            old_val = merged_value[key]
            merged_value[key] = [old_val, val]
    # Line changed by KV
    merged_values.append(len(merged_value['group_members']))
  return merged_values


def _merge_values_dict(values):
  """
  When you call values() on a queryset where the Model has a ManyToManyField
  and there are multiple related items, it returns a separate dictionary for each
  related item. This function merges the dictionaries so that there is only
  one dictionary per id at the end, with lists of related items for each.

  https://gist.github.com/pamelafox-coursera/3707015
  """
  grouped_results = itertools.groupby(values, key=lambda value: value['id'])

  merged_values = {}
  for k, g in grouped_results:

    groups = list(g)
    merged_value = {}
    for group in groups:
      for key, val in group.iteritems():
        if not merged_value.get(key):
          merged_value[key] = [val]
        elif val != merged_value[key]:
          if isinstance(merged_value[key], list):
            if val not in merged_value[key]:
              merged_value[key].append(val)
          else:
            print 'Should never reach here. TODO: Catherine read this and confirm'
            old_val = merged_value[key]
            merged_value[key] = [old_val, val]
    # Line changed by KV
    merged_values[merged_value['id'][0]] = len(merged_value['group_members'])
  return merged_values


def _get_graded_submission_scores(assessment):
  """
  Returns a list of `graded_submission_scores`. Takes care of multiplying by counts
  in case of homework that has groups_allowed.

  WARNING: This code is highly optimized. Think twice before making changes
  TODO: Catherine, please read and verify this
  """
  if hasattr(assessment, 'homework') and assessment.homework.groups_allowed:
    # Get scores for each group
    grouped_graded_submission_scores = models.Submission.objects.values_list(
      'points', flat=True).filter(graded=True, assessment=assessment, last=True).order_by('id')

    # Get number of group members in each group
    num_members_dict = models.Submission.objects.values('id', 'group_members').filter(graded=True,
      assessment=assessment, last=True).order_by('id')
    num_members_list = _merge_values(num_members_dict)

    graded_submission_scores = []
    index = 0
    for score in grouped_graded_submission_scores:
      num_members = num_members_list[index]
      for _ in range(num_members):
        graded_submission_scores.append(score)
      index += 1

  else:
    graded_submission_scores = models.Submission.objects.values_list(
      'points', flat=True).filter(graded=True, assessment=assessment, last=True)

  return graded_submission_scores


def _validate_course_user_id(cur_course_user, course_user_id):
  """
  Only staff can access assessment information for other course users
  If `course_user_id` is None, we simply return `cur_course_user` because we are
  not trying to see anyone else's report.
  Otherwise, we validate that:
    1. `cur_course_user` is staff
    2. `course_user_id` is a valid course_user in `cur_course_user`s course
  and return the `course_user` corresponding to `course_user_id`
  """
  if not course_user_id or course_user_id == '0':
    return cur_course_user

  if cur_course_user.is_student():
    raise http.Http404

  course_user = shortcuts.get_object_or_404(models.CourseUser,
    course=cur_course_user.course, pk=course_user_id)

  return course_user


def _get_all_percentile_scores(course_user):
  """
  Returns a dictionary of the form:
  {
    'labels': 'assessment name 1', 'assessment name 2'...,
    'percentile': 'percentile in assessment 1', .....
  }
  """
  submission_set = models.Submission.objects.filter(assessment__course=course_user.course.pk,
    last=True, released=True, graded=True, group_members=course_user).order_by('assessment__id')

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
  graded_submission_scores = _get_graded_submission_scores(assessment)

  if course_user.is_student():
    submissions = models.Submission.objects.filter(assessment=assessment, last=True,
      group_members=course_user)
    submission = submissions[0]

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

  num_members_dict = models.Submission.objects.values('id', 'group_members').filter(graded=True,
      assessment=assessment, last=True).order_by('id')
  num_members_dict = _merge_values_dict(num_members_dict)

  if question_parts.count() > 0 and submission_set.count() > 0:
    num_questions = question_parts[question_parts.count() - 1].question_number

    for question_number in range(num_questions):
      stats = _get_question_statistics(assessment, submission_set, question_number + 1,
        question_parts, course_user, num_members_dict)
      question_statistics.append(stats)

  return question_statistics


def _get_question_statistics(assessment, submission_set, question_number,
    question_parts, course_user, num_members_dict):
  """
  Calculates the median, mean, max and standard deviation among all the assessments
  for which this question_number has been graded.
  Also calculates the same for each part for given question
  """
  question_parts = question_parts.filter(question_number=question_number)

  num_question_parts = question_parts.count()
  graded_question_scores = raw_sql.get_graded_question_scores(submission_set,
    question_number, num_question_parts, num_members_dict)

  if course_user.is_student():
    submissions = models.Submission.objects.filter(assessment=assessment, last=True,
      group_members=course_user)
    submission = submissions[0]

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

  # If the step size is 1
  if step_size == 1:
    bins.append(curr)
    labels.append('%d' % curr)
  elif labels:
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
