from django import shortcuts, http
from django.core import files
from django.contrib import messages
from classallyapp import models, forms, decorators
from classallyapp.views import helpers
import json, shlex, subprocess, tempfile, threading


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def exams(request, cur_course_user):
  """
  Shows existing exams and allows the user to edit/delete them.

  Also allows the user to upload a new exam. On success, redirects to the
  create exam page.
  """
  cur_course = cur_course_user.course

  if request.method == 'POST':
    form = forms.ExamUploadForm(request.POST, request.FILES)

    if form.is_valid():
      # We set page_count = 0 here and update it after uploading images
      exam = models.Exam(course=cur_course, name=form.cleaned_data['exam_name'], page_count=0)
      exam.save()

      page_count = _upload_exam_pdf_as_jpeg_to_s3(request.FILES['exam_file'], exam)
      _upload_exam_pdf_to_s3(request.FILES['exam_file'], exam, exam.exam_pdf)
      
      exam.page_count = page_count
      exam.save()

      if 'exam_solutions_file' in request.FILES:
        _upload_exam_pdf_to_s3(request.FILES['exam_solutions_file'], exam, exam.solutions_pdf)
      
      return shortcuts.redirect('/course/%d/create-exam/%d' % (cur_course.pk, exam.pk))
  else:
    form = forms.ExamUploadForm()

  exams = models.Exam.objects.filter(course=cur_course)
  # TODO: only allow deletion of exams that haven't been graded

  return helpers.render(request, 'exams.epy', {
    'title': 'Upload',
    'course': cur_course,
    'form': form,
    'exams': exams,
  })


# TODO: should this be accessible to both the instructor and TA?
@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def delete_exam(request, cur_course_user, exam_id):
  """ Allows the instructor/TA to delete a user from the course roster. """
  cur_course = cur_course_user.course
  models.Exam.objects.filter(pk=exam_id, course=cur_course).delete()

  # TODO: add trailing slash to redirects
  return shortcuts.redirect('/course/%d/exams/' % cur_course.pk)


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def create_exam(request, cur_course_user, exam_id):
  """
  Step 2 of creating an exam. We have an object in the Exam models and now are 
  adding the questions and rubrics.
  """
  exam = shortcuts.get_object_or_404(models.Exam, pk=exam_id)
  if request.method == 'POST':
    questions = json.loads(request.POST['questions-json'])
    # Validate the new rubrics and store the new forms in form_list
    success, form_list = _validate_exam_creation(questions)

    if not success:
      for error in form_list:
        messages.add_message(request, messages.ERROR, error)
    else:
      # If we are editing an existing exam, delete the previous one
      models.Question.objects.filter(exam=exam).delete()

      for form_type, form in form_list:
        # TODO: bad one-letter variable name
        f = form.save(commit=False)
        
        if form_type == 'question':
          f.exam = exam
          f.save()
          question = models.Question.objects.get(pk=f.id)
        else:
          f.question = question
          f.save()

      # Now, we create a preview exam answer
      exam_answer = _create_preview_exam_answer(cur_course_user, exam)
      return http.HttpResponseRedirect('/course/%d/preview-exam/%s/' %
        (cur_course_user.course.id, exam_answer.pk))

  return helpers.render(request, 'create-exam.epy', {'title': 'Create'})


def _create_preview_exam_answer(cur_course_user, exam):
  """
  Creates a fake exam_answer that the instructor can preview while creating the
  exam. This fake exam_answer is deleted once the instructor clicks on save or edit
  """
  exam_answer = models.ExamAnswer(exam=exam, course_user=cur_course_user,
    page_count=exam.page_count, preview=True, pdf=exam.exam_pdf)
  exam_answer.save()

  questions = models.Question.objects.filter(exam=exam)
  for question in questions:
    question_answer = models.QuestionAnswer(exam_answer=exam_answer, question=question, 
      pages=question.pages)
    question_answer.save()
  # TODO: Race condition where uploading images hasn't finished. FML

  exam_pages = models.ExamPage.objects.filter(exam=exam)
  for exam_page in exam_pages:
    exam_answer_page = models.ExamAnswerPage(exam_answer=exam_answer,
      page_number=exam_page.page_number, page_jpeg=exam_page.page_jpeg)
    exam_answer_page.save()

  return exam_answer


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def map_exams(request, cur_course_user, exam_id):
  """ Renders the map exams page """
  return helpers.render(request, 'map-exams.epy', {'title': 'Map Exams'})


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def students_info(request, cur_course_user, exam_id):
  """
  Returns a json representation of a list where each element has the name, email,
  student_id of the student along with 'tokens' which is needed by typeahead.js
  """
  exam = shortcuts.get_object_or_404(models.Exam, pk=exam_id)
  students = models.CourseUser.objects.filter(course=cur_course_user.course,
    privilege=models.CourseUser.STUDENT)

  students_to_return = []
  for student in students:
    student_to_return = {
      'name': student.user.get_full_name(),
      'email': student.user.email,
      'student_id': student.user.student_id,
      'tokens': [student.user.first_name, student.user.last_name]
    }

    # Check if the student has already been mapped or not
    try:
      exam_answer = models.ExamAnswer.objects.get(course_user=student,exam=exam)
      student_to_return['mapped'] = True
    except:
      student_to_return['mapped'] = False

    students_to_return.append(student_to_return)
  return http.HttpResponse(json.dumps(students_to_return), mimetype='application/json')


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def get_empty_exam_jpeg(request, cur_course_user, exam_id, page_number):
  """ Returns the URL where the jpeg of the empty uploaded exam can be found """
  exam_page = shortcuts.get_object_or_404(models.ExamPage, exam_id=exam_id, page_number=page_number)
  # return http.HttpResponse(exam_page.page_jpeg, mimetype='image/jpeg')
  return shortcuts.redirect(exam_page.page_jpeg.url)

@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def get_empty_exam_page_count(request, cur_course_user, exam_id):
  """ Returns the number of pages in the exam """
  exam = shortcuts.get_object_or_404(models.Exam, pk=exam_id)
  return http.HttpResponse(exam.page_count)


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def recreate_exam(request, cur_course_user, exam_id):
  """
  Needed to edit exam rubrics. Returns a JSON to the create-exam.js ajax call
  that will then call recreate-exam.js to recreat the UI
  """
  exam = shortcuts.get_object_or_404(models.Exam, pk=exam_id)
  
  questions_list = []

  # Get the questions associated with the exam
  questions = models.Question.objects.filter(exam_id=exam.id)
  question_number = 0
  
  for question in questions:
    # Increment question_number only when it changes
    # If it hasn't changed, it means we are on a new part of the same question
    if question_number != question.question_number:
      question_number += 1
      questions_list.append([])

    part = {
      'points': question.max_points,
      'pages': question.pages.split(','),
      'rubrics': []
    }

    rubrics = models.Rubric.objects.filter(question=question)
    for rubric in rubrics:
      part['rubrics'].append({
        'description': rubric.description,
        'points': rubric.points
      })

    questions_list[question_number - 1].append(part)

  return http.HttpResponse(json.dumps(questions_list), mimetype='application/json')


def _upload_exam_pdf_as_jpeg_to_s3(f, exam):
  """
  Given a file f, which is expected to be an exam pdf, breaks it into jpegs for each
  page and uploads them to s3. Returns the number of pages in the pdf file
  """
  # TODO: Put this on top once you talk about it with Karthik and Squishy
  from PyPDF2 import PdfFileReader

  # Create a named temporary file and write the pdf to it
  # Needed for the convert subprocess call
  temp_pdf = tempfile.NamedTemporaryFile(suffix='.pdf')
  temp_pdf.seek(0)
  temp_pdf.write(f.read())
  temp_pdf.flush()

  def upload(temp_pdf, page_number, exam):
    # CAUTION: Only works on unix
    temp_jpeg = tempfile.NamedTemporaryFile(suffix='.jpg')

    # 'convert pdf_file_name[page_number] img_name'
    subprocess.call(shlex.split('convert -density 150 -size 1200x900 ' + 
      temp_pdf.name + '[' + str(page_number) + '] '+ temp_jpeg.name))

    # Save it
    exam_page = models.ExamPage(exam=exam, page_number=page_number+1)
    exam_page.page_jpeg.save('new', files.File(temp_jpeg))
    exam_page.save()

    # Close for automatic deletion
    temp_jpeg.close()

  # Needed so we can find the total number of pages
  pdf = PdfFileReader(file(temp_pdf.name, 'rb'))
  
  # TODO: I believe the new plan is to return immediately and show a loading
  # sign until the image is uploaded.
  upload(temp_pdf, 0, exam)

  # Create a separate thread for each of them
  for i in range(1, pdf.getNumPages()):
     t = threading.Thread(target=upload, args=(temp_pdf, i, exam)).start()

  return pdf.getNumPages()


def _upload_exam_pdf_to_s3(f, exam, exam_pdf_field):
  """ Uploads a pdf file representing an exam or its solutions to s3 """
  def upload(f, exam):
    exam_pdf_field.save('new', files.File(f))
    exam.save()
  t = threading.Thread(target=upload, args=(f, exam)).start()


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
    question_number += 1
    part_number = 0

    # Loop over all the parts
    for part in question:
      part_number += 1
      # Create the form needed for QuestionForm validation
      question_form = {
        'question_number': question_number,
        'part_number': part_number,
        'max_points': part['points'],
        'pages': ','.join(map(str, part['pages']))
      }

      form = forms.QuestionForm(question_form)
      if form.is_valid():
        form_list.append(('question', form))
      else:
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
          return False, form.errors.values()

  return True, form_list
