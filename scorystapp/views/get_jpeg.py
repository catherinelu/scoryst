from django import shortcuts, http
from scorystapp import models, decorators
from scorystapp.views import grade


@decorators.access_controlled
@decorators.student_required
def get_assessment_jpeg(request, cur_course_user, submission_id, page_number, assessment_id=None):
  """
  Redirects to the jpeg corresponding to submission_id and page_number.
  assessment_id is optional, since some URLs may capture it and others may not. It is
  captured if in the URL so that the decorator can verify its consistency with
  the submission_id.
  """
  assessment_page = shortcuts.get_object_or_404(models.SubmissionPage, submission_id=submission_id,
    page_number=page_number)
  return shortcuts.redirect(assessment_page.page_jpeg.url)


@decorators.access_controlled
@decorators.student_required
def get_assessment_jpeg_large(request, cur_course_user, submission_id, page_number, assessment_id=None):
  """
  Redirects to the large jpeg corresponding to submission_id and page_number.
  assessment_id is optional, since some URLs may capture it and others may not. It is
  captured if in the URL so that the decorator can verify its consistency with
  the submission_id.
  """
  assessment_page = shortcuts.get_object_or_404(models.SubmissionPage, submission_id=submission_id,
    page_number=page_number)
  return shortcuts.redirect(assessment_page.page_jpeg_large.url)


@decorators.access_controlled
@decorators.student_required
def get_offset_student_jpeg(request, cur_course_user, submission_id, offset,
    page_number, assessment_id=None):
  """
  Redirects to the jpeg corresponding to page_number for the answer present at
  offset from the current submission; if we reach either bounds (0 or last assessment),
  we return the bound
  """
  # Ensure the submission_id exists
  shortcuts.get_object_or_404(models.Submission, pk=submission_id)

  next_submission = grade.get_offset_student_assessment(submission_id, offset)
  assessment_page = shortcuts.get_object_or_404(models.SubmissionPage, submission=next_submission,
    page_number=page_number)
  return shortcuts.redirect(assessment_page.page_jpeg.url)


@decorators.access_controlled
@decorators.student_required
def get_assessment_page_count(request, cur_course_user, submission_id, assessment_id=None):
  """ Returns the number of pages in the assessment """
  submission = shortcuts.get_object_or_404(models.Submission, pk=submission_id)
  return http.HttpResponse(submission.page_count)


@decorators.access_controlled
@decorators.instructor_or_ta_required
def get_blank_assessment_jpeg(request, cur_course_user, assessment_id, page_number):
  """ Redirects to the empty assessment jpeg for the provided page number """
  assessment_page = shortcuts.get_object_or_404(models.AssessmentPage, assessment_id=assessment_id,
    page_number=page_number)
  return shortcuts.redirect(assessment_page.page_jpeg.url)


@decorators.access_controlled
@decorators.instructor_or_ta_required
def get_blank_assessment_jpeg_large(request, cur_course_user, assessment_id, page_number):
  """ Redirects to the empty large assessment jpeg for the provided page number """
  assessment_page = shortcuts.get_object_or_404(models.AssessmentPage, assessment_id=assessment_id,
    page_number=page_number)
  return shortcuts.redirect(assessment_page.page_jpeg_large.url)


@decorators.access_controlled
@decorators.instructor_or_ta_required
def get_blank_assessment_page_count(request, cur_course_user, assessment_id):
  """ Returns the number of pages in the assessment """
  assessment = shortcuts.get_object_or_404(models.Assessment, pk=assessment_id)
  return http.HttpResponse(assessment.page_count)


@decorators.access_controlled
@decorators.instructor_or_ta_required
def get_offset_student_jpeg_with_question_number(request, cur_course_user, submission_id,
    offset, question_number, part_number):
  """
  Gets the jpeg corresponding to question_number and part_number for the student
  present at 'offset' from the current student. If there is no student at that
  offset, the student at one of the bounds (0 or last index) is returned.
  """
  # Ensure the submission_id exists
  shortcuts.get_object_or_404(models.Submission, pk=submission_id)

  next_submission = grade.get_offset_student_assessment(submission_id, offset)
  # Get the response to find which page question_number and part_number lie on
  question_part = shortcuts.get_object_or_404(models.QuestionPart,
    assessment=next_submission.assessment, question_number=question_number, part_number=part_number)
  response = shortcuts.get_object_or_404(models.Response,
    submission=next_submission, question_part=question_part)

  assessment_page = shortcuts.get_object_or_404(models.SubmissionPage, submission=next_submission,
    page_number=int(response.pages.split(',')[0]))
  return shortcuts.redirect(assessment_page.page_jpeg.url)
