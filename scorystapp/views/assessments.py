from celery import task as celery
from django import shortcuts, http
from django.core import files
from django.contrib import messages
from scorystapp import models, forms, decorators, utils, assessments_serializers
from scorystapp.views import helpers
from django.conf import settings
import json, shlex, subprocess, tempfile, threading
import os
import PyPDF2
from rest_framework import serializers
from rest_framework import decorators as rest_decorators, response as rest_framework_response
import pdb


@decorators.access_controlled
@decorators.instructor_or_ta_required
def assessments(request, cur_course_user):
  """
  Shows existing assessments and allows the user to edit/delete them.

  Also allows the user to upload a new assessment. On success, redirects to the
  create assessment page.
  """
  if request.method == 'POST':
    return _handle_assessment_upload(request, cur_course_user)
  return _render_assessments_page(request, cur_course_user)


def _render_assessments_page(request, cur_course_user):
  return helpers.render(request, 'assessments.epy', {
    'title': 'Assessments',
    'course': cur_course_user.course,
    'form': forms.AssessmentUploadForm(),
    'homework_exist': models.Homework.objects.filter(course=cur_course_user.course).count() > 0,
    'exam_exist': models.Exam.objects.filter(course=cur_course_user.course).count() > 0
  })


def _handle_assessment_upload(request, cur_course_user, assessment_id=None):
  form = forms.AssessmentUploadForm(request.POST, request.FILES)

  if not form.is_valid():
    return _render_assessments_page(request, cur_course_user)

  data = form.cleaned_data

  assessment = None
  course = cur_course_user.course
  grade_down = True if data['grade_type'] == 'down' else False

  # Delete old `QuestionPart`s before new ones are created
  if assessment_id:
    assessment = shortcuts.get_object_or_404(models.Assessment, pk=assessment_id)
    qpa = models.QuestionPart.objects.filter(assessment=assessment)
    qpa.delete()

  if data['assessment_type'] == 'exam':
    exam = None
    if assessment_id:
      exam = shortcuts.get_object_or_404(models.Exam, pk=assessment_id)
      exam.name = data['name']
      exam.grade_down = grade_down
      exam.save()

      # Delete old `ExamPage`s
      exam_pages = models.ExamPage.objects.filter(exam=exam)
      exam_pages.delete()
    else:
      # We set page_count = 0 here and update it after uploading images
      exam = models.Exam(course=course, name=data['name'], grade_down=grade_down,
                         page_count=0)
      exam.save()  # need exam id for uploading, so we save immediately

    if (assessment_id and 'exam_file' in request.FILES) or not assessment_id:
      page_count = _upload_exam_pdf_as_jpeg_to_s3(request.FILES['exam_file'], exam)
      _upload_exam_pdf_to_s3(request.FILES['exam_file'], exam, exam.exam_pdf)

      exam.page_count = page_count
    exam.save()

    if 'solutions_file' in request.FILES:
      _upload_exam_pdf_to_s3(request.FILES['solutions_file'], exam, exam.solutions_pdf)

    assessment = exam

    # Create question parts for the assessment
    question_part_info = json.loads(data['question_part_points'])
    for i, part_info in enumerate(question_part_info):
      for j, points_and_pages in enumerate(part_info):
        points = points_and_pages[0]
        pages = points_and_pages[1].replace(' ', '')
        new_question_part = models.QuestionPart(assessment=assessment, question_number=i+1,
                                                part_number=j+1, max_points=points, pages=pages)
        print 'created new question part', new_question_part
        new_question_part.save()

  else:
    if assessment_id:
      homework = shortcuts.get_object_or_404(models.Homework, pk=assessment_id)
      homework.name = data['name']
      homework.grade_down = grade_down
    else:
      homework = models.Homework(course=course, name=data['name'], grade_down=grade_down,
                                 submission_deadline=data['submission_deadline'])
    homework.save()

    if 'solutions_file' in request.FILES:
      _upload_exam_pdf_to_s3(request.FILES['solutions_file'], homework, homework.solutions_pdf)

    assessment = homework

    # Create question parts for the assessment
    question_part_points = json.loads(data['question_part_points'])
    for i, part_points in enumerate(question_part_points):
      for j, points in enumerate(part_points):
        new_question_part = models.QuestionPart(assessment=assessment, question_number=i+1,
                                                part_number=j+1, max_points=points)
        print new_question_part
        new_question_part.save()

  return shortcuts.redirect('/course/%d/assessments/create/%d' % (cur_course_user.course.pk, assessment.pk))


@decorators.access_controlled
@decorators.instructor_or_ta_required
def delete_assessment(request, cur_course_user, assessment_id):
  """ Allows the instructor/TA to delete a user from the course roster. """
  cur_course = cur_course_user.course

  # explicitly query the course to ensure user can access this assessment
  assessment = models.Assessment.objects.get(pk=assessment_id)
  submissions = models.Submission.objects.filter(assessment=assessment, preview=False)

  # Only allow editing if submissions don't exist
  if not submissions:
    assessment.delete()
  else:
    pass

  return shortcuts.redirect('/course/%d/assessments/' % cur_course.pk)


@decorators.access_controlled
@decorators.instructor_or_ta_required
def create_assessment(request, cur_course_user, assessment_id, **kwargs):
  """
  TODO: update
  Step 2 of creating an assessment. We have an object in the Assessment models
  and now are adding the question parts.
  """
  assessment = shortcuts.get_object_or_404(models.Assessment, pk=assessment_id)

  if request.method == 'POST':
    print 'deleting question parts'
    # Delete all of the old question parts
    _handle_assessment_upload(request, cur_course_user, assessment_id)

  return helpers.render(request, 'assessments.epy', {
    'title': 'Assessments',
    'course': cur_course_user.course,
    'form': forms.AssessmentUploadForm(),
    'assessment_id': assessment_id,
    'assessment_name': assessment.name,
    'homework_exist': models.Homework.objects.filter(course=cur_course_user.course).count() > 0,
    'exam_exist': models.Exam.objects.filter(course=cur_course_user.course).count() > 0
  })


def _create_preview_exam_answer(cur_course_user, exam):
  """
  Creates a fake exam_answer that the instructor can preview while creating the
  exam.
  """
  # Delete all previous preview exams
  exam_answers = models.Submission.objects.filter(exam=exam,
    course_user=cur_course_user, preview=True)
  exam_answers.delete()

  exam_answer = models.Submission(exam=exam, course_user=cur_course_user,
    page_count=exam.page_count, preview=True, pdf=exam.exam_pdf)
  exam_answer.save()

  question_parts = models.QuestionPart.objects.filter(exam=exam)
  for question_part in question_parts:
    response = models.Response(exam_answer=exam_answer,
      question_part=question_part, pages=question_part.pages)
    response.save()

  exam_pages = models.ExamPage.objects.filter(exam=exam)
  for exam_page in exam_pages:
    exam_answer_page = models.SubmissionPage(exam_answer=exam_answer,
      page_number=exam_page.page_number, page_jpeg=exam_page.page_jpeg, page_jpeg_large=exam_page.page_jpeg_large)
    exam_answer_page.save()

  return exam_answer


@decorators.access_controlled
@decorators.instructor_or_ta_required
def get_saved_assessment(request, cur_course_user, assessment_id):
  """
  Needed to edit exam rubrics. Returns a JSON to the create-exam.js ajax call
  that will then call recreate-exam.js to recreate the UI
  """
  exam = shortcuts.get_object_or_404(models.Exam, pk=assessment_id)

  questions_list = []

  # Get the question_parts associated with the exam
  question_parts = models.QuestionPart.objects.filter(assessment_id=exam.id).order_by(
    'question_number', 'part_number')
  question_number = 0

  for question_part in question_parts:
    # Increment question_number only when it changes
    # If it hasn't changed, it means we are on a new part of the same question
    if question_number != question_part.question_number:
      question_number += 1
      questions_list.append([])

    part = {
      'points': question_part.max_points,
      'pages': question_part.pages.split(','),
      'rubrics': []
    }

    rubrics = models.Rubric.objects.filter(question_part=question_part)
    for rubric in rubrics:
      part['rubrics'].append({
        'description': rubric.description,
        'points': rubric.points
      })

    questions_list[question_number - 1].append(part)

  return_object = {
    'questions': questions_list,
    'grade_down': exam.grade_down
  }
  return http.HttpResponse(json.dumps(return_object), mimetype='application/json')


@celery.task
def upload(temp_pdf_name, num_pages, exam):
  temp_pdf = open(temp_pdf_name, 'r')

  # ImageMagick command is: 'convert pdf_file_name[page_number] img_name'
  for page_number in range(num_pages):
    temp_jpeg = tempfile.NamedTemporaryFile(suffix='.jpg')

    subprocess.call(shlex.split('convert -density 150 -size 1200x900 ' +
      temp_pdf.name + '[' + str(page_number) + '] '+ temp_jpeg.name))

    # Save it
    exam_page = models.ExamPage(exam=exam, page_number=page_number+1)
    exam_page.page_jpeg.save('new', files.File(temp_jpeg))
    exam_page.page_jpeg_large = exam_page.page_jpeg
    exam_page.save()

    # Close for automatic deletion
    temp_jpeg.close()

  # Delete the pdf file
  os.remove(temp_pdf_name)


# TODO: Use celery
def _upload_exam_pdf_as_jpeg_to_s3(f, exam):
  """
  Given a file f, which is expected to be an exam pdf, breaks it into jpegs for each
  page and uploads them to s3. Returns the number of pages in the pdf file.
  """
  temp_pdf_name = '/tmp/temp%s.pdf' % utils.generate_random_string(5)
  temp_pdf = open(temp_pdf_name, 'w')
  temp_pdf.seek(0)
  temp_pdf.write(f.read())
  temp_pdf.flush()

  pdf = PyPDF2.PdfFileReader(file(temp_pdf_name, 'rb'))
  upload.delay(temp_pdf_name, pdf.getNumPages(), exam)
  return pdf.getNumPages()


def _upload_exam_pdf_to_s3(f, assessment, assessment_pdf_field):
  """ Uploads a pdf file representing an exam or its solutions to s3 """
  def upload(f, assessment):
    assessment_pdf_field.save('new', files.File(f))
    assessment.save()
  t = threading.Thread(target=upload, args=(f, assessment)).start()


def _validate_exam_creation(questions):
  """
  Validates the given exam, creating a form object for each question and rubric.

  Returns (boolean, a list of tuples), where boolean is true if validation was
  successful and false otherwise. Each tuple is of the form (type, form).

  type is either question or rubric, depending on whether form corresponds to a
  QuestionForm or RubricForm.
  form is the form object itself. Note that we don't save the forms because we
  want the entire exam creation to be batched; either we create the exam in its
  entirety, or we don't create it all.
  """
  form_list = []
  question_number = 0

  # Loop over all the questions
  for question in questions:
    if not question:
      continue
    question_number += 1
    part_number = 0

    # Loop over all the parts
    for part in question:
      part_number += 1
      # Create the form needed for QuestionForm validation
      question_part_form = {
        'question_number': question_number,
        'part_number': part_number,
        'max_points': part['points'],
        'pages': ','.join(map(str, part['pages']))
      }

      form = forms.QuestionPartForm(question_part_form)
      if form.is_valid():
        form_list.append(('question_part', form))
      else:
        print 'question part form is false'
        return False, form.errors.values()

      # Loop over the rubrics
      for rubric in part['rubrics']:
        rubric_form = {
          'description': rubric['description'],
          'points': rubric['points']
        }

        form = forms.RubricForm(rubric_form)
        if form.is_valid():
          form_list.append(('rubric', form))
        else:
          print 'rubric form is false'
          return False, form.errors.values()

  return True, form_list


@rest_decorators.api_view(['GET'])
@decorators.access_controlled
def list_assessments(request, cur_course_user, assessment_id=None):
  """ Returns a list of `Assessment`s for the provided course. """
  # if assessment_id is not None:
  #   assessment = shortcuts.get_object_or_404(models.Assessment, pk=assessment_id)
  #   serializer = assessments_serializers.AssessmentSerializer(assessment)
  #   return rest_framework_response.Response(serializer.data)
  # else:
  assessments = models.Assessment.objects.filter(course=cur_course_user.course)
  serializer = assessments_serializers.AssessmentSerializer(assessments, many=True)
  return rest_framework_response.Response(serializer.data)


@rest_decorators.api_view(['GET', 'POST'])
@decorators.access_controlled
def list_question_parts(request, cur_course_user, assessment_id):
  """ Returns a list of `Assessment`s for the provided course. """
  assessment = shortcuts.get_object_or_404(models.Assessment, pk=assessment_id)
  if request.method == 'GET':
    question_parts = models.QuestionPart.objects.filter(assessment=assessment
      ).order_by('question_number', 'part_number')
    serializer = assessments_serializers.QuestionPartSerializer(question_parts, many=True)
    return rest_framework_response.Response(serializer.data)
  # elif request.method == 'POST':  # TODO: remove
  #   serializer = assessments_serializers.QuestionPartSerializer(data=request.DATA,
  #     context={ 'assessment': assessment })
  #   print 'saving question part serializer. assessment: ', assessment
  #   if serializer.is_valid():
  #     serializer.save()
  #     return rest_framework_response.Response(serializer.data)

  #   return rest_framework_response.Response(serializer.errors, status=422)

@rest_decorators.api_view(['GET', 'POST', 'DELETE', 'PUT'])
@decorators.access_controlled
def list_rubrics(request, cur_course_user, assessment_id, question_part_id):
  """ Returns a list of `Assessment`s for the provided course. """
  if question_part_id == -1:
    return rest_framework_response.Response(None)
  question_parts = models.QuestionPart.objects.filter(assessment=assessment_id)
  serializer = assessments_serializers.QuestionPartSerializer(question_parts, many=True)
  return rest_framework_response.Response(serializer.data)
