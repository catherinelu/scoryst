from django import shortcuts, http
from scorystapp import models, decorators, assign_serializers
from scorystapp.views import helpers, grade, grade_or_view
from rest_framework import decorators as rest_decorators, response
import json


@decorators.access_controlled
@decorators.instructor_or_ta_required
def assign(request, cur_course_user, exam_id, submission_id=None):
  """ Renders the assign exams page """
  # If no submission_id is given, show the first submission
  if submission_id is None:
    submissions = models.Submission.objects.filter(assessment_id=exam_id,
      preview=False).order_by('id')
    if not submissions.count() == 0:
      submission_id = submissions[0].id
      return shortcuts.redirect('/course/%s/assessments/%s/assign/%s/' %
        (cur_course_user.course.id, exam_id, submission_id))
    else:
      raise http.Http404

  return helpers.render(request, 'assign.epy', {'title': 'Assign Exam Answers'})


@rest_decorators.api_view(['GET'])
@decorators.access_controlled
@decorators.instructor_or_ta_required
def get_students(request, cur_course_user, exam_id):
  """
  Returns a list of students for the current exam. Includes whether each student
  has been assigned or not.
  """
  cur_course = cur_course_user.course
  exam = shortcuts.get_object_or_404(models.Exam, pk=exam_id)
  course_users = models.CourseUser.objects.filter(course=cur_course.pk,
    privilege=models.CourseUser.STUDENT).order_by('id')

  serializer = assign_serializers.CourseUserSerializer(course_users, many=True,
    context={ 'exam': exam })
  return response.Response(serializer.data)


@rest_decorators.api_view(['GET'])
@decorators.access_controlled
@decorators.instructor_or_ta_required
def list_submissions(request, cur_course_user, exam_id):
  """ Lists all the exam answers associated with the given exam """
  exam = shortcuts.get_object_or_404(models.Exam, pk=exam_id)
  submissions = models.Submission.objects.filter(assessment=exam, preview=False).order_by('id')

  serializer = assign_serializers.SubmissionSerializer(submissions, many=True,
    context={ 'exam': exam })
  return response.Response(serializer.data)


@rest_decorators.api_view(['GET', 'PUT'])
@decorators.access_controlled
@decorators.instructor_or_ta_required
def manage_submission(request, cur_course_user, exam_id, submission_id):
  """ Updates a single `submission` """
  # TODO: Prevent non-exams from being updated accidentally
  submission = shortcuts.get_object_or_404(models.Submission, pk=submission_id)

  if request.method == 'GET':
    serializer = assign_serializers.SubmissionSerializer(submission,
      context={ 'exam': submission.assessment })
    return response.Response(serializer.data)
  elif request.method == 'PUT':
    serializer = assign_serializers.SubmissionSerializer(submission,
      data=request.DATA, context={ 'exam': submission.assessment })

    if serializer.is_valid():
      serializer.save()
      return response.Response(serializer.data)
    return response.Response(serializer.errors, status=422)
