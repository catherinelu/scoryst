from django import shortcuts, http
from scorystapp import models, decorators, raw_sql
from scorystapp.views import helpers
from scorystapp.views import report_utilities as utils
from scorystapp.performance import cache_helpers
import json


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
  histogram = utils.get_histogram(graded_submission_scores)

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

  num_group_members_map = None
  if hasattr(assessment, 'homework') and assessment.homework.groups_allowed:
    # Get number of group members in each group
    num_group_members_map = models.Submission.objects.values('id', 'group_members').filter(
        assessment=assessment, last=True).order_by('id')
    num_group_members_map = utils.merge_values(num_group_members_map, False)

  graded_question_scores = raw_sql.get_graded_question_scores(submission_set,
    question_number, num_question_parts, num_group_members_map)

  histogram = utils.get_histogram(graded_question_scores)
  return http.HttpResponse(json.dumps(histogram), mimetype='application/json')


@decorators.access_controlled
@decorators.submission_released_required
def get_all_percentile_scores(request, cur_course_user, course_user_id=None):
  """ Returns the set of percentile scores for the course_user """
  course_user = _validate_course_user_id(cur_course_user, course_user_id)

  data = _get_all_percentile_scores(course_user)
  return http.HttpResponse(json.dumps(data), mimetype='application/json')


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
    num_group_members_map = models.Submission.objects.values('id', 'group_members').filter(graded=True,
      assessment=assessment, last=True).order_by('id')
    num_members_list = utils.merge_values(num_group_members_map)

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
    graded_submission_scores = _get_graded_submission_scores(submission.assessment)
    percentile = utils.percentile(graded_submission_scores, submission.points)

    labels.append(submission.assessment.name)
    percentiles.append(percentile)

  return {
    'labels': labels,
    'percentiles': percentiles
  }


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
    'median': utils.median(graded_submission_scores),
    'mean': utils.mean(graded_submission_scores),
    'max': utils.max(graded_submission_scores),
    'std_dev': utils.standard_deviation(graded_submission_scores),
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

  num_group_members_map = None
  if hasattr(assessment, 'homework') and assessment.homework.groups_allowed:
    num_group_members_map = models.Submission.objects.values('id', 'group_members').filter(
        assessment=assessment, last=True).order_by('id')
    num_group_members_map = utils.merge_values(num_group_members_map, False)

  if question_parts.count() > 0 and submission_set.count() > 0:
    num_questions = question_parts[question_parts.count() - 1].question_number

    for question_number in range(num_questions):
      stats = _get_question_statistics(assessment, submission_set, question_number + 1,
        question_parts, course_user, num_group_members_map)
      question_statistics.append(stats)

  return question_statistics


def _get_question_statistics(assessment, submission_set, question_number,
    question_parts, course_user, num_group_members_map):
  """
  Calculates the median, mean, max and standard deviation among all the assessments
  for which this question_number has been graded.
  Also calculates the same for each part for given question
  """
  question_parts = question_parts.filter(question_number=question_number)

  num_question_parts = question_parts.count()
  graded_question_scores = raw_sql.get_graded_question_scores(submission_set,
    question_number, num_question_parts, num_group_members_map)

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
    'median': utils.median(graded_question_scores),
    'mean': utils.mean(graded_question_scores),
    'max': utils.max(graded_question_scores),
    'std_dev': utils.standard_deviation(graded_question_scores),
    'student_score': student_score
  }

