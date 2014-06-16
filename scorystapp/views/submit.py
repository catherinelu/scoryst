from django import shortcuts
from django.core import files
from django.db.models.fields import files as file_fields
from scorystapp import models, forms, decorators, utils
from scorystapp.views import helpers
from celery import task as celery
from scorystapp.apis import evangelist
from datetime import datetime
import PyPDF2
import os
import shutil
import requests


@decorators.access_controlled
def submit(request, cur_course_user):
  """ Allows students to submit homework. """
  cur_course = cur_course_user.course
  homeworks = models.Homework.objects.filter(course=cur_course).order_by('-id')

  # (option value, option display) tuple for form select field
  homework_choices = [(hw.id, hw.name) for hw in homeworks]

  if request.method == 'POST':
    form = forms.HomeworkUploadForm(homework_choices, request.POST, request.FILES)

    if form.is_valid():
      homework = shortcuts.get_object_or_404(models.Homework)
      homework_file = request.FILES['homework_file']

      submission = _create_submission(homework, cur_course_user, homework_file)
      _create_submission_pages.delay(submission)

      # TODO: redirect
      return shortcuts.redirect('/course/%s/submit/' % cur_course_user.course.id)
  else:
    form = forms.HomeworkUploadForm(homework_choices)

  submission_set = models.Submission.objects.filter(course_user=
    cur_course_user).select_related('assessment__homework').order_by('-time')
  submission_set = filter(lambda submission:
    hasattr(submission.assessment, 'homework'), submission_set)

  return helpers.render(request, 'submit.epy', {
    'title': 'Submit',
    'course': cur_course,
    'form': form,
    'submission_set': submission_set,
  })


def _create_submission(homework, course_user, pdf_file):
  """
  Creates a PDF submission, by the given user, for the provided homework.
  Returns the Submission object.
  """
  reader = PyPDF2.PdfFileReader(pdf_file)
  page_count = reader.getNumPages()
  pdf_file.seek(0)  # undo work of PyPDF2

  submission = models.Submission(assessment=homework, course_user=course_user,
    page_count=page_count, released=False, preview=False, time=datetime.today())
  submission.pdf.save('homework-pdf', files.File(pdf_file))

  submission.save()
  return submission


@celery.task
def _create_submission_pages(submission):
  """
  Creates submission pages for the given PDF. Employs Evangelist to perform
  PDF -> JPEG conversion.
  """
  random_prefix = utils.generate_random_string(50)
  jpeg_path = 'homework-pages/%s%%d.jpeg' % random_prefix

  large_jpeg_path = 'homework-pages/%s%%d-large.jpeg' % random_prefix
  pages_to_save = []

  print 'Preparing submission pages...'

  for page_number in xrange(submission.page_count):
    # paths to normal and large JPEGs; these haven't been uploaded yet
    jpeg_path_for_page = jpeg_path % page_number
    jpeg_field = file_fields.ImageFieldFile(instance=None,
      field=file_fields.FileField(), name=jpeg_path_for_page)

    large_jpeg_path_for_page = large_jpeg_path % page_number
    large_jpeg_field = file_fields.ImageFieldFile(instance=None,
      field=file_fields.FileField(), name=large_jpeg_path_for_page)

    # prepare all submission pages
    submission_page = models.SubmissionPage(submission=submission,
      page_number=page_number, page_jpeg=jpeg_field,
      page_jpeg_large=large_jpeg_field, is_blank=False)
    pages_to_save.append(submission_page)

  print 'Making request to Evangelist...'
  response_text = evangelist.convert_pdf_to_jpegs(submission.pdf.name,
    jpeg_path, large_jpeg_path)

  print 'Got Evangelist response text: %s' % response_text

  # finalize all submission pages
  for submission_page in pages_to_save:
    submission_page.save()

  print 'Finalized submission pages!'
