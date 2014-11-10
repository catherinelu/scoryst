from django import http, shortcuts
from django.core import files
from django.db.models.fields import files as file_fields
from django.utils import timezone
from scorystapp import models, forms, decorators, utils, serializers
from scorystapp.views import helpers
from celery import task as celery
from scorystapp.apis import evangelist
from datetime import datetime
from rest_framework import decorators as rest_decorators, response
import PyPDF2
import os
from scorystapp.views import email_sender
import shutil
import requests


@decorators.access_controlled
@decorators.instructor_or_ta_required
def modify_group(request, cur_course_user, submission_id):
  """ Instructors and TAs modify the group members for a particular submission. """
  emails = request.POST['emails']
  # Get a list of `CourseUser`s corresponding to the comma-separated email string.
  # `_clean_group_member_emails` may fail i.e. return None, so if that's the case,
  # return an error and relevant message back.
  new_group_members = forms._clean_group_member_emails(emails, cur_course_user.course)
  if not new_group_members:
    return http.HttpResponse('One or more emails were not found in this course', status=400)

  submission = shortcuts.get_object_or_404(models.Submission, id=submission_id)

  # Check to ensure that the instructor/TA entered in the email of the student who
  # submitted the assignment. If not, return an error and relevant message back.
  if submission.course_user not in set(new_group_members):
    return http.HttpResponse('You must include the email of the student who submitted the assignment.',
      status=400)

  # Mark submissions that the new group members are a part of as last=False
  _handle_previous_submissions(request, submission.assessment.homework, new_group_members)

  # Remove all of the old group members
  previous_group_members = submission.group_members.all()
  for previous_member in previous_group_members:
    submission.group_members.remove(previous_member)

  # Add the new group members
  for new_member in new_group_members:
    submission.group_members.add(new_member)

  return http.HttpResponse()


@decorators.access_controlled
def submit(request, cur_course_user):
  """ Allows students to submit homework. """
  cur_course = cur_course_user.course
  homeworks = models.Homework.objects.filter(course=cur_course).order_by('-id')

  # (option value, option display) tuple for form select field
  homework_choices = [(hw.id, '%s: Due %s' %(hw.name, timezone.localtime(
    hw.soft_deadline).strftime('%a, %b %d, %I:%M %p'))) for hw in homeworks]
  student_choices = []

  is_staff = (cur_course_user.privilege == models.CourseUser.INSTRUCTOR or
    cur_course_user.privilege == models.CourseUser.TA)

  if is_staff:
    student_choices = (models.CourseUser.objects.filter(
      course=cur_course_user.course, privilege=models.CourseUser.STUDENT)
      .prefetch_related('user'))

    student_choices = [(student.pk, '%s <%s>' %
      (student.user.get_full_name(), student.user.email))
      for student in student_choices]

    student_choices = sorted(student_choices, key=lambda student: student[1].lower())

  if request.method == 'POST':
    form = forms.HomeworkUploadForm(is_staff, homework_choices, student_choices,
      cur_course.get_timezone_string(), cur_course_user.id, cur_course.id, request.POST, request.FILES)

    if form.is_valid():
      homework = models.Homework.objects.get(pk=form.cleaned_data['homework_id'])
      homework_file = request.FILES['homework_file']

      student = cur_course_user
      if is_staff:
        # staff is submitting as a certain student
        student = models.CourseUser.objects.get(pk=form.cleaned_data['student_id'])

      # Get all the new group members, including the student
      new_group_members = form.cleaned_data['group_members']
      new_group_members.append(student)

      _handle_previous_submissions(request, homework, new_group_members)

      submission = _create_submission(homework, student, homework_file,
        form.cleaned_data['group_members'])

      _create_empty_responses(submission)
      _create_submission_pages.delay(submission)

      return shortcuts.redirect('/course/%s/submit/%d/' %
        (cur_course_user.course.id, submission.pk))
  else:
    form = forms.HomeworkUploadForm(is_staff, homework_choices, student_choices,
      cur_course.get_timezone_string(), cur_course_user.id, cur_course.id)

  submission_set = models.Submission.objects.filter(course_user=
    cur_course_user)
  submission_set = submission_set.prefetch_related('assessment',
    'assessment__homework').order_by('-time')
  submission_set = filter(lambda submission:
    hasattr(submission.assessment, 'homework'), submission_set)

  max_group_sizes = [0 if not hw.groups_allowed else hw.max_group_size for hw in homeworks]

  return helpers.render(request, 'submit.epy', {
    'title': 'Submit',
    'is_staff': is_staff,
    'course': cur_course,
    'form': form,
    'submission_set': submission_set,
    'max_group_sizes': max_group_sizes,
    'cur_student_email': None if is_staff else cur_course_user.user.email
  })


def _handle_previous_submissions(request, homework, new_group_members):
  """
  1. For all of the previous submissions for each group_member, mark previous submission's `last`
  field as False
  2. If there were group members who are no longer part of the group, send them an email
  """
  new_group_members = set(new_group_members)

  # Set of emails that have already been informed of the group change
  already_emailed = set()

  for group_member in new_group_members:
    # For each group member, get their previous "last" submission, if any
    last_submission = models.Submission.objects.filter(assessment=homework,
      last=True, group_members=group_member)

    if last_submission.count() > 0:
      # Change the previous "last" submission to False
      last_submission = last_submission[0]
      last_submission.last = False
      last_submission.save()

      previous_group_members = set(last_submission.group_members.all())
      # Get the students who were previously in the group, but no longer are
      # These students will have to resubmit their work
      students_must_resubmit = previous_group_members - new_group_members

      for student_to_resubmit in students_must_resubmit:
        user = student_to_resubmit.user

        # We might have emailed them already due to redundancy in this code
        if user.email not in already_emailed:
          already_emailed.add(user.email)
          email_sender.send_must_resubmit_email(request, user,
            homework.name, student_to_resubmit.course.name, student_to_resubmit.course.id)


def _create_submission(homework, course_user, pdf_file, group_members):
  """
  Creates a PDF submission, by the given user, for the provided homework.
  Returns the Submission object.
  """
  reader = PyPDF2.PdfFileReader(pdf_file)
  page_count = reader.getNumPages()
  pdf_file.seek(0)  # undo work of PyPDF2

  submission = models.Submission(assessment=homework, course_user=course_user,
    page_count=page_count, released=False, preview=False, last=True,
    time=timezone.now())
  submission.pdf.save('homework-pdf', files.File(pdf_file))

  submission.group_members.add(course_user)
  submission.save()

  if homework.groups_allowed:
    submission.group_members.add(*group_members)
    submission.save()

  return submission


def _create_empty_responses(submission):
  """ Creates empty responses for the given submission. """
  question_parts = submission.assessment.questionpart_set.all()
  for qp in question_parts:
    response = models.Response(submission=submission, question_part=qp,
      pages=None, grader_comments=None, grader=None, custom_points=None)
    response.save()


@celery.task
def _create_submission_pages(submission):
  """
  Creates submission pages for the given PDF. Employs Evangelist to perform
  PDF -> JPEG conversion.
  """
  random_prefix = utils.generate_random_string(50)
  jpeg_path = 'homework-pages/%s%%d.jpeg' % random_prefix

  small_jpeg_path = 'homework-pages/%s%%d-small.jpeg' % random_prefix
  large_jpeg_path = 'homework-pages/%s%%d-large.jpeg' % random_prefix
  pages_to_save = []

  print 'Preparing submission pages...'

  for page_number in xrange(1, submission.page_count + 1):
    # paths to normal, small, and large JPEGs; these haven't been uploaded yet
    jpeg_path_for_page = jpeg_path % page_number
    jpeg_field = file_fields.ImageFieldFile(instance=None,
      field=file_fields.FileField(), name=jpeg_path_for_page)

    small_jpeg_path_for_page = small_jpeg_path % page_number
    small_jpeg_field = file_fields.ImageFieldFile(instance=None,
      field=file_fields.FileField(), name=small_jpeg_path_for_page)

    large_jpeg_path_for_page = large_jpeg_path % page_number
    large_jpeg_field = file_fields.ImageFieldFile(instance=None,
      field=file_fields.FileField(), name=large_jpeg_path_for_page)

    # prepare all submission pages
    submission_page = models.SubmissionPage(submission=submission,
      page_number=page_number, page_jpeg=jpeg_field, is_blank=False,
      page_jpeg_small=small_jpeg_field, page_jpeg_large=large_jpeg_field)
    pages_to_save.append(submission_page)

  print 'Making request to Evangelist...'
  response_text = evangelist.convert_pdf_to_jpegs(submission.pdf.name,
    jpeg_path, small_jpeg_path, large_jpeg_path)

  print 'Got Evangelist response text: %s' % response_text

  # finalize all submission pages
  for submission_page in pages_to_save:
    submission_page.save()

  print 'Finalized submission pages!'


@decorators.access_controlled
@decorators.student_required
def map_submission(request, cur_course_user, submission_id):
  submission = shortcuts.get_object_or_404(models.Submission, pk=submission_id)
  assessment = submission.assessment
  question_parts = assessment.questionpart_set.order_by('question_number', 'part_number')

  return helpers.render(request, 'map-submission.epy', {
    'title': 'Map Submission',
    'course': cur_course_user.course,
    'submission': submission,
    'assessment': assessment,
    'question_parts': question_parts,
  })


@rest_decorators.api_view(['GET'])
@decorators.access_controlled
@decorators.student_required
def get_submission_pages(request, cur_course_user, submission_id):
  submission = shortcuts.get_object_or_404(models.Submission, pk=submission_id)
  submission_pages = submission.submissionpage_set.order_by('page_number')

  serializer = serializers.SubmissionPageSerializer(submission_pages, many=True)
  return response.Response(serializer.data)


@rest_decorators.api_view(['GET'])
@decorators.access_controlled
@decorators.student_required
def get_responses(request, cur_course_user, submission_id):
  submission = shortcuts.get_object_or_404(models.Submission, pk=submission_id)
  responses = submission.response_set.all()

  serializer = serializers.SubmitResponseSerializer(responses, many=True)
  return response.Response(serializer.data)


@rest_decorators.api_view(['PUT'])
@decorators.access_controlled
@decorators.student_required
def update_response(request, cur_course_user, submission_id, response_id):
  # include both submission and response ID for security
  response_model = shortcuts.get_object_or_404(models.Response,
    submission=int(submission_id), pk=int(response_id))
  serializer = serializers.SubmitResponseSerializer(response_model,
    data=request.DATA)

  if serializer.is_valid():
    serializer.save()
    return response.Response(serializer.data)
  return response.Response(serializer.errors, status=422)


@rest_decorators.api_view(['GET'])
@decorators.access_controlled
@decorators.instructor_or_ta_required
def get_submissions(request, cur_course_user, course_user_id):
  submission_set = models.Submission.objects.filter(group_members=course_user_id)
  submission_set = submission_set.prefetch_related('assessment',
    'assessment__homework').order_by('-time')
  submission_set = filter(lambda submission:
    hasattr(submission.assessment, 'homework'), submission_set)

  serializer = serializers.SubmissionSerializer(submission_set, many=True)
  return response.Response(serializer.data)


@rest_decorators.api_view(['GET'])
@decorators.access_controlled
def get_self_submissions(request, cur_course_user):
  submission_set = models.Submission.objects.filter(group_members=cur_course_user)

  submission_set = submission_set.prefetch_related('assessment',
    'assessment__homework').order_by('-time')
  submission_set = filter(lambda submission:
    hasattr(submission.assessment, 'homework'), submission_set)

  serializer = serializers.SubmissionSerializer(submission_set, many=True)
  return response.Response(serializer.data)
