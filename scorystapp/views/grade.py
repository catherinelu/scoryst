from django import shortcuts, http
from scorystapp import models, forms, decorators, serializers
from scorystapp.views import helpers
from rest_framework import decorators as rest_decorators, response


@decorators.access_controlled
@decorators.instructor_or_ta_required
def grade(request, cur_course_user, submission_id):
  """ Allows an instructor/TA to grade an assessment. """
  submission = shortcuts.get_object_or_404(models.Submission, pk=submission_id)

  return helpers.render(request, 'grade.epy', {
    'title': 'Grade',
    'course_user': cur_course_user,
    'course': cur_course_user.course.name,
    'student_name': _get_group_members_from_submission(submission),
    'solutions_exist': bool(submission.assessment.solutions_pdf.name),
    'is_grade_page': True
  })


@rest_decorators.api_view(['GET'])
@decorators.access_controlled
@decorators.instructor_or_ta_required
def get_previous_student(request, cur_course_user, submission_id):
  """
  Given a particular student's assessment, returns the grade page for the previous
  student, ordered alphabetically by last name, then first name, then email.
  If there is no previous student, the same student is returned.
  """
  cur_submission = shortcuts.get_object_or_404(models.Submission, pk=submission_id)
  skip_graded = request.GET.get('skipGraded', False) == 'true'
  question_number = int(request.GET.get('questionNumber', 0))
  part_number = int(request.GET.get('partNumber', 0))

  previous_submission = get_offset_student_assessment(submission_id, -1, skip_graded,
                                                      question_number, part_number)

  return response.Response({
    'student_path': '/course/%d/grade/%d/' % (cur_course_user.course.pk,
      previous_submission.pk),
    'student_name': _get_group_members_from_submission(previous_submission),
  })


@rest_decorators.api_view(['GET'])
@decorators.access_controlled
@decorators.instructor_or_ta_required
def get_next_student(request, cur_course_user, submission_id):
  """
  Given a particular student's assessment, returns the grade page for the next
  student, ordered alphabetically by last name, then first name, then email.
  If there is no next student, the same student is returned.
  """
  cur_submission = shortcuts.get_object_or_404(models.Submission, pk=submission_id)
  skip_graded = request.GET.get('skipGraded', False) == 'true'
  question_number = int(request.GET.get('questionNumber', 0))
  part_number = int(request.GET.get('partNumber', 0))

  next_submission = get_offset_student_assessment(submission_id, 1, skip_graded,
                                                  question_number, part_number)

  return response.Response({
    'student_path': '/course/%d/grade/%d/' % (cur_course_user.course.pk,
      next_submission.pk),
    'student_name': _get_group_members_from_submission(next_submission),
  })

def _get_group_members_from_submission(submission):
  group_members = [cu.user.get_full_name() for cu in submission.group_members.all()]
  submitter = submission.course_user.user.get_full_name()
  group_members.remove(submitter)
  group_members = [submitter] + group_members

  return (', ').join(group_members)


def get_offset_student_assessment(submission_id, offset, skip_graded=False, question_number=0, part_number=0):
  """
  Gets the assessment for the student present at 'offset' from the current student.
  If there is no student at that offset, the student at one of the bounds (0 or last index)
  is returned.
  """
  offset = int(offset)
  submission_id = int(submission_id)

  # Get the assessment of the current student
  cur_submission = shortcuts.get_object_or_404(models.Submission, pk=submission_id)

  # Fetch all submissions
  submissions = models.Submission.objects.filter(assessment=cur_submission.assessment,
    preview=False, course_user__isnull=False, last=True).order_by('course_user__user__first_name',
    'course_user__user__last_name', 'course_user__user__email')

  # Calculate the index of the current submission
  for cur_index, submission in enumerate(submissions.all()):
    if submission_id == submission.id:
      break

  total = submissions.count()

  # Fetch the index at offset from current, if possible, else return a bound
  if cur_index + offset >= 0 and cur_index + offset < total:
    next_index = cur_index + offset
  elif cur_index + offset < 0:
    next_index = 0
  else:
    next_index = total - 1

  # Get the submission corresponding to the index
  next_submission = submissions[next_index]

  # If any of these are not provided, don't loop at all
  while skip_graded and question_number and part_number:
    # I shouldn't need a try statement here. I'm doing this because I'm a pussy
    # and don't want to risk things breaking if part_number is out of bounds etc.
    # As such, I'm 99% sure this won't happen
    try:
      response = models.Response.objects.get(submission=next_submission,
          question_part__question_number=question_number, question_part__part_number=part_number)
    except:
      break

    # Found a response that isn't graded, we're done
    if not response.graded:
      break

    offset = 1 if offset >= 0 else -1
    next_index = next_index + offset
    # Stay within the bounds. If we are at last student already or first student, then stop
    if next_index < 0 or next_index > total - 1:
      break
    next_submission = submissions[next_index]

  return next_submission
