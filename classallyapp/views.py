from boto.s3.key import Key
from classallyapp import models, forms, decorators, utils
from django import shortcuts, http
from django.contrib import messages, auth
from django.core import context_processors
from django.core.files import File
from django.utils import timezone, simplejson
import json
import shlex
import subprocess
import tempfile
import time
import threading


def login(request, redirect_path):
  """ Allows the user to log in. """
  # redirect path is relative to root
  redirect_path = '/%s' % redirect_path

  if request.user.is_authenticated():
    return shortcuts.redirect(redirect_path)

  if request.method == 'POST':
    form = forms.UserLoginForm(request.POST)

    if form.is_valid():
      # authentication should pass cleanly (already checked by UserLoginForm)
      user = auth.authenticate(username=form.cleaned_data['email'],
        password=form.cleaned_data['password'])
      auth.login(request, user)

      return shortcuts.redirect(redirect_path)
  else:
    form = forms.UserLoginForm()

  return _render(request, 'login.epy', {
    'title': 'Login',
    'login_form': form,
  })


# TODO: docs
def logout(request):
  auth.logout(request)
  return shortcuts.redirect('/login')


@decorators.login_required
def new_course(request):
  """ Allows the user to create a new course to grade. """
  if request.method == 'POST':
    form = forms.CourseForm(request.POST)

    if form.is_valid():
      course = form.save()
      course_user = models.CourseUser(user=request.user,
          course=course, privilege=models.CourseUser.INSTRUCTOR)
      course_user.save()
  else:
    form = forms.CourseForm()

  return _render(request, 'new-course.epy', {
    'title': 'New Course',
    'new_course_form': form,
  })


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def grade_overview(request, cur_course_user):
  """ Overview of all of the students' exams and grades for a particular exam. """
  cur_course = cur_course_user.course
  
  exams = models.Exam.objects.filter(course=cur_course.pk)
  student_course_users = models.CourseUser.objects.filter(course=cur_course.pk,
    privilege=models.CourseUser.STUDENT)
  student_users = map(lambda course_user: course_user.user, student_course_users)

  return _render(request, 'grade-overview.epy', {
    'title': 'Exams',
    'exams': exams,
    'student_users': student_users,
  })


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def get_user_exam_summary(request, cur_course_user, user_id, exam_id):
  """ Returns an exam summary given the user's ID and the course. """

  try:
    exam_answer = models.ExamAnswer.objects.get(exam=exam_id, course_user__user=user_id)
  except models.ExamAnswer.DoesNotExist:
    return http.HttpResponse(json.dumps({'noMappedExam': True}),
      mimetype='application/json')

  exam_summary = _get_exam_summary(exam_answer.id)
  return http.HttpResponse(json.dumps(exam_summary), mimetype='application/json')


@decorators.login_required
@decorators.course_required
@decorators.student_required
def view_exam(request, cur_course_user, exam_answer_id):
  """
  Intended as the URL for students who are viewing their exam. Renders the same
  grade template.
  """
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  is_student = cur_course_user.privilege == models.CourseUser.STUDENT

  return _render(request, 'grade.epy', {
    'title': 'View Exam',
    'course': cur_course_user.course.name,
    'studentName': exam_answer.course_user.user.get_full_name(),
    'isStudent' : is_student,
    'solutionsExist': True if exam_answer.exam.solutions_pdf.name else False
  })


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def grade(request, cur_course_user, exam_answer_id):
  """ Allows an instructor/TA to grade an exam. """
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)

  return _render(request, 'grade.epy', {
    'title': 'Grade',
    'course': cur_course_user.course.name,
    'studentName': exam_answer.course_user.user.get_full_name(),
    'solutionsExist': True if exam_answer.exam.solutions_pdf.name else False
  })


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def get_exam_page_mappings(request, cur_course_user, exam_answer_id):
  """
  Returns a JSON representation of the pages associated with each question
  part, specifically an array of arrays. The inner array holds the pages
  corresponding to a particular question part, and the outer array contains all
  of the question part pages arrays.
  """

  question_answers = models.QuestionAnswer.objects.filter(exam_answer=exam_answer_id
    ).order_by('question__question_number', 'question__part_number')

  pages_to_return = []
  for question_answer in question_answers:
    pages = [int(page) for page in question_answer.pages.split(',')]
    pages_to_return.append(pages)

  return http.HttpResponse(json.dumps(pages_to_return), mimetype='application/json')


@decorators.login_required
@decorators.course_required
def get_rubrics(request, cur_course_user, exam_answer_id, question_number, part_number):
  """
  Returns rubrics, merged from rubrics and graded rubrics, associated with the
  particular question number and part number as JSON.

  The resulting rubrics have the following fields: description, points, custom
  (bool), and selected (bool).
  """
  # Get the corresponding exam answer
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)

  # Get the question corresponding to the question number and part number
  question = shortcuts.get_object_or_404(models.Question, exam=exam_answer.exam_id,
      question_number=question_number, part_number=part_number)

  question_answer = shortcuts.get_object_or_404(models.QuestionAnswer,
    exam_answer=exam_answer, question=question)

  # Get the rubrics and graded rubrics associated with the particular exam and
  # question part.
  rubrics = (models.Rubric.objects.filter(question=question)
    .order_by('question__question_number', 'question__part_number', 'id'))
  graded_rubrics = (models.GradedRubric.objects.filter(question=question,
    question_answer=question_answer).order_by('question__question_number',
    'question__part_number', 'id'))

  rubrics_to_return = {
    'rubrics': [],
    'graded': False,
    'points': question.max_points,
    'maxPoints': question.max_points,
    'questionNumber': question_number,
    'partNumber': part_number,
  }

  if question_answer.grader is not None:
    user = question_answer.grader.user
    rubrics_to_return['grader'] = (user.first_name + ' ' + user.last_name + ' ('
      + user.email + ')')

  # Merge the rubrics and graded rubrics into a list of rubrics (represented as
  # dicts) with the following fields: description, points, custom, and selected.
  for rubric in rubrics:
    cur_rubric = {
      'description': rubric.description,
      'points': rubric.points,
      'custom': False,
      'rubricPk': rubric.pk,
      'selected': False,
    }
    cur_rubric['color'] = 'red' if cur_rubric['points'] < 0 else 'green'

    # Iterate over graded rubrics and check if it is actually selected.
    # TODO: Make more efficient than O(N^2)?
    for graded_rubric in graded_rubrics:
      if graded_rubric.rubric == rubric:
        cur_rubric['selected'] = True
        break
    rubrics_to_return['rubrics'].append(cur_rubric)

  # Adds up the points for the overall question part
  for graded_rubric in graded_rubrics:
    rubrics_to_return['graded'] = True
    # Check to see if there is a custom rubric.
    if graded_rubric.custom_points != None:
      rubrics_to_return['points'] += graded_rubric.custom_points
      is_custom_rubric = True
    else:
      rubrics_to_return['points'] += graded_rubric.rubric.points

  # Take care of the custom rubric case
  custom_rubric = {
    'description': 'Custom points',
    'custom': True,
  }

  # Add custom rubric to the end
  try:  # If a custom rubric exists
    custom_graded_rubric = models.GradedRubric.objects.get(question=question, rubric=None,
      question_answer=question_answer)
    custom_rubric['points'] = custom_graded_rubric.custom_points
    custom_rubric['selected'] = True
    custom_rubric['customRubricId'] = custom_graded_rubric.id
  except models.GradedRubric.DoesNotExist:
    custom_rubric['selected'] = False
    custom_rubric['points'] = 0
  custom_rubric['color'] = 'red' if custom_rubric['points'] < 0 else 'green'
  rubrics_to_return['rubrics'].append(custom_rubric)

  # Add in the comment field
  try:
    question_answer = models.QuestionAnswer.objects.get(exam_answer=exam_answer,
      question=question)
  except models.QuestionAnswer.DoesNotExist:
    return http.HttpResponse(status=422)

  rubrics_to_return['comment'] = False
  if len(question_answer.grader_comments) > 0:
    rubrics_to_return['graderComments'] = question_answer.grader_comments
    rubrics_to_return['comment'] = True

  return http.HttpResponse(json.dumps(rubrics_to_return), mimetype='application/json')


@decorators.login_required
@decorators.course_required
def get_exam_summary(request, cur_course_user, exam_answer_id, question_number, part_number):
  """
  Returns the questions and question answers as JSON.
  """
  exam_to_return = _get_exam_summary(exam_answer_id, int(question_number), int(part_number))
  return http.HttpResponse(json.dumps(exam_to_return), mimetype='application/json')


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def modify_custom_rubric(request, cur_course_user, exam_answer_id):
  """
  Modifies the custom point value for a custom rubric. Parameters are passed in
  the POST body.
  """

  # Get POST variables
  custom_points = request.POST['customPoints']
  custom_rubric_id = request.POST['customRubricId']

  custom_rubric = shortcuts.get_object_or_404(models.GradedRubric, pk=custom_rubric_id)
  custom_rubric.custom_points = custom_points
  custom_rubric.save()

  return http.HttpResponse(status=200)


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def save_graded_rubric(request, cur_course_user, exam_answer_id):
  """
  Given a rubric_id, either add a graded_rubric corresponding to that rubric (if
  add_or_delete == 'add') or else delete the graded_rubric corresponding to that
  rubric. For custom rubrics, the rubric_id is blank. For non-custom rubrics,
  the custom_points and custom_rubric_id parameters are blank.
  """

  # Get POST variables
  question_number = request.POST['curQuestionNum']
  part_number = request.POST['curPartNum']
  add_or_delete = request.POST['addOrDelete']
  rubric_id = request.POST['rubricNum']
  try:
    custom_points = request.POST['customPoints']
    custom_rubric_id = request.POST['customRubricId']
  except:
    pass

  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  question = shortcuts.get_object_or_404(models.Question, exam=exam_answer.exam,
    question_number=question_number, part_number=part_number)
  question_answer = shortcuts.get_object_or_404(models.QuestionAnswer,
    exam_answer=exam_answer_id, question=question)

  if rubric_id != '':  # If the saved rubric is not a custom rubric
    rubric = shortcuts.get_object_or_404(models.Rubric, pk=rubric_id)
  if add_or_delete == 'add':
    # Update the question_answer's grader to this current person
    question_answer.grader = cur_course_user
    question_answer.save()

    # Create and save the new graded_rubric (this marks the rubric as graded)
    if rubric_id != '':
      graded_rubric = models.GradedRubric(question_answer=question_answer,
        question=question, rubric=rubric)
    else:
      graded_rubric = models.GradedRubric(question_answer=question_answer,
        question=question, custom_points=custom_points)
    graded_rubric.save()
  else:
    if rubric_id != '':
      graded_rubric = shortcuts.get_object_or_404(models.GradedRubric, rubric=rubric,
        question_answer=question_answer)
    else:
      graded_rubric = shortcuts.get_object_or_404(models.GradedRubric, rubric=None,
        question_answer=question_answer, question__question_number=question_number,
        question__part_number=part_number)
    graded_rubric.delete()  # Effectively unmarks the rubric as graded

  return http.HttpResponse(status=200)


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def save_comment(request, cur_course_user, exam_answer_id):
  """
  The comment to be saved should be given as a GET parameter. Saves the comment
  in the associated question_answer.
  """

  # Get POST parameters
  question_number = request.POST['curQuestionNum']
  part_number = request.POST['curPartNum']
  comment = request.POST['comment']

  question_answer = shortcuts.get_object_or_404(models.QuestionAnswer,
    exam_answer=exam_answer_id, question__question_number=question_number,
    question__part_number=part_number)
  question_answer.grader_comments = comment
  question_answer.save()

  return http.HttpResponse(status=200)

@decorators.login_required
@decorators.course_required
def get_exam_jpeg(request, cur_course_user, exam_answer_id, page_number):
  """ Returns the URL where the jpeg of the empty uploaded exam can be found """
  exam_page = shortcuts.get_object_or_404(models.ExamAnswerPage, exam_answer_id=exam_answer_id,
   page_number=page_number)
  # return http.HttpResponse(exam_page.page_jpeg, mimetype='image/jpeg')
  return shortcuts.redirect(exam_page.page_jpeg.url)


@decorators.login_required
@decorators.course_required
def get_exam_solutions_pdf(request, cur_course_user, exam_answer_id):
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  return shortcuts.redirect(exam_answer.exam.solutions_pdf.url)


@decorators.login_required
@decorators.course_required
def get_exam_pdf(request, cur_course_user, exam_answer_id):
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  return shortcuts.redirect(exam_answer.pdf.url)


@decorators.login_required
@decorators.course_required
def get_exam_page_count(request, cur_course_user, exam_answer_id):
  """ Returns the number of pages in the exam_answer """
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  return http.HttpResponse(exam_answer.page_count)


def _get_previous_student_exam_answer(cur_exam_answer):
  """
  Given a particular student's exam, returns the exam_answer for the previous
  student, ordered alphabetically by last name, then first name, then email.
  If there is no previous student, the same student is returned.
  """

  exam_answers = models.ExamAnswer.objects.filter(exam=cur_exam_answer.exam, preview=False).order_by(
    'course_user__user__last_name', 'course_user__user__first_name', 'course_user__user__email')
  prev_exam_answer = None

  for exam_answer in exam_answers:
    # Match is found
    if exam_answer.id == cur_exam_answer.pk:
      # No previous student, so stay at same student
      if prev_exam_answer is None:
        # TODO: never use query strings; always put variables in URL directly
        return cur_exam_answer
      else:
        return prev_exam_answer
    # No match yet. Update prev_exam_answer
    else:  
      prev_exam_answer = exam_answer


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def get_previous_student(request, cur_course_user, exam_answer_id):
  """
  Given a particular student's exam, returns the grade page for the previous
  student, ordered alphabetically by last name, then first name, then email.
  If there is no previous student, the same student is returned.
  """

  cur_exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  prev_exam_answer = _get_previous_student_exam_answer(cur_exam_answer)
  return http.HttpResponseRedirect('/course/%d/grade/%s/' %
          (cur_course_user.course.id, prev_exam_answer.pk))


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def get_previous_student_jpeg(request, cur_course_user, exam_answer_id, question_number, part_number):
  """
  Gets the jpeg corresponding to question_number and part_number for the previous student
  If there is no previous student, the same student is returned.
  """
  # TODO: There has to be a cleaner way of doing this

  # Get the exam of the current student
  cur_exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)

  # Get the exam of the next student  
  prev_exam_answer = _get_previous_student_exam_answer(cur_exam_answer)

  # Get the question_answer to find which page question_number and part_number lie on
  question = shortcuts.get_object_or_404(models.Question, exam=prev_exam_answer.exam,
    question_number=question_number,part_number=part_number)
  question_answer = shortcuts.get_object_or_404(models.QuestionAnswer, exam_answer=prev_exam_answer,
    question=question)

  return get_exam_jpeg(request, cur_course_user, prev_exam_answer.pk, 
    int(question_answer.pages.split(',')[0]))


def _get_next_student_exam_answer(cur_exam_answer):
  """
  Given a particular student's exam, returns the exam_answer for the next
  student, ordered alphabetically by last name, then first name, then email.
  If there is no next student, the same student is returned.
  """
  found_exam_answer = False
  exam_answers = models.ExamAnswer.objects.filter(exam=cur_exam_answer.exam, preview=False).order_by(
    'course_user__user__last_name', 'course_user__user__first_name', 'course_user__user__email')

  for exam_answer in exam_answers:
    # Match is found
    if exam_answer.id == cur_exam_answer.pk:  
      found_exam_answer = True
    elif found_exam_answer:
      return exam_answer

  # If the exam was the last one
  if found_exam_answer:  
    return cur_exam_answer


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def get_next_student(request, cur_course_user, exam_answer_id):
  """
  Given a particular student's exam, returns the grade page for the next
  student, ordered alphabetically by last name, then first name, then email.
  If there is no next student, the same student is returned.
  """

  cur_exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  next_exam_answer = _get_next_student_exam_answer(cur_exam_answer)
  return http.HttpResponseRedirect('/course/%d/grade/%d/' %
        (cur_course_user.course.id, next_exam_answer.id))


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def get_next_student_jpeg(request, cur_course_user, exam_answer_id, question_number, part_number):
  """
  Gets the jpeg corresponding to question_number and part_number for the next student
  If there is no next student, the same student is returned.
  """
  # TODO: There has to be a cleaner way of doing this

  # Get the exam of the current student
  cur_exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  
  # Get the exam of the next student
  next_exam_answer = _get_next_student_exam_answer(cur_exam_answer)

  # Get the question_answer to find which page question_number and part_number lie on
  question = shortcuts.get_object_or_404(models.Question, exam=next_exam_answer.exam,
    question_number=question_number,part_number=part_number)
  question_answer = shortcuts.get_object_or_404(models.QuestionAnswer, exam_answer=next_exam_answer,
    question=question)

  return get_exam_jpeg(request, cur_course_user, next_exam_answer.pk, 
    int(question_answer.pages.split(',')[0]))


@decorators.login_required
@decorators.course_required
@decorators.instructor_required
def roster(request, cur_course_user):
  """ Allows the instructor to manage a course roster. """
  cur_course = cur_course_user.course

  if request.method == 'POST':
    form = forms.AddPeopleForm(request.POST)

    if form.is_valid():
      people = form.cleaned_data.get('people')
      privilege = form.cleaned_data.get('privilege')

      for person in people.splitlines():
        first_name, last_name, email, student_id = person.split(',')

        # for each person, find/create a corresponding user
        try:
          user = models.User.objects.get(email=email)
        except models.User.DoesNotExist:
          password = utils._generate_random_string(50)
          user = models.User.objects.create_user(email, first_name, last_name,
            student_id, password)

        try:
          course_user = models.CourseUser.objects.get(user=user.pk, course=cur_course.pk)
        except models.CourseUser.DoesNotExist:
          # add that user to the course
          course_user = models.CourseUser(user=user, course=cur_course,
            privilege=privilege)
        else:
          # if the user is already in the course, simply update his/her privileges
          course_user.privilege = privilege

        course_user.save()

      return shortcuts.redirect(request.path)
  else:
    form = forms.AddPeopleForm()

  course_users = models.CourseUser.objects.filter(course=cur_course.pk)
  return _render(request, 'roster.epy', {
    'title': 'Roster',
    'add_people_form': form,
    'course': cur_course,
    'course_users': course_users,
  })

@decorators.login_required
@decorators.course_required
@decorators.instructor_required
def delete_from_roster(request, cur_course_user, course_user_id):
  """ Allows the instructor to delete a user from the course roster. """
  cur_course = cur_course_user.course
  # TODO: does this ensure the course is cur_course, or does it just use the pk?
  models.CourseUser.objects.filter(pk=course_user_id, course=cur_course).delete()

  return shortcuts.redirect('/course/%d/roster' % cur_course.pk)


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def upload_exam(request, cur_course_user):
  """
  Step 1 of creating an exam where the user enters the name of the exam, a blank
  exam pdf and optionally a solutions pdf. On success, we redirect to the
  create-exam page
  """
  if request.method == 'POST':
    form = forms.ExamUploadForm(request.POST, request.FILES)

    if form.is_valid():
      cur_course = cur_course_user.course
    
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

  return _render(request, 'upload-exam.epy', {
    'title': 'Upload',
    'form': form
  })


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

  return _render(request, 'create-exam.epy', {'title': 'Create'})


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
def preview_exam(request, cur_course_user, exam_answer_id):
  """
  Intended as the URL for TAs who are previewing the exams they created. 
  Renders the same grade template.
  """
  # TODO: in case deletion doesn't work, everywhere exam answers are returned
  # ensure isPreview is False
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)

  return _render(request, 'grade.epy', {
    'title': 'Preview Exam',
    'course': cur_course_user.course.name,
    'studentName': exam_answer.course_user.user.get_full_name(),
    'isPreview' : True,
    'solutionsExist': True if exam_answer.exam.solutions_pdf.name else False
  })


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def save_created_exam(request, cur_course_user, exam_answer_id):
  """
  Called when the instructor is done viewing exam preview. Deletes the fake exam_answer
  and redirects the user. The exam was already saved so we don't need tp save it
  again
  """
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  exam = exam_answer.exam

  exam_answers = models.ExamAnswer.objects.filter(exam=exam,
    course_user=cur_course_user, preview=True)
  exam_answers.delete()
  # TODO: Figure out where to redirect
  return shortcuts.redirect('/login')


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def edit_created_exam(request, cur_course_user, exam_answer_id):
  """
  Called when the instructor wants to edit his exam. Delete the fake exam_answer
  and redirects to creation page
  """
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  exam = exam_answer.exam

  exam_answers = models.ExamAnswer.objects.filter(exam=exam,
    course_user=cur_course_user, preview=True)
  exam_answers.delete()
  return http.HttpResponseRedirect('/course/%d/create-exam/%s/' %
        (cur_course_user.course.id, exam.pk))


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def map_exams(request, cur_course_user, exam_id):
  """ Renders the map exams page """
  return _render(request, 'map-exams.epy', {'title': 'Map Exams'})


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


def _get_exam_summary(exam_answer_id, question_number=0, part_number=0):
  """
  Returns the questions and question answers as JSON.

  The resulting questions have the following fields: points, maxPoints, graded
  (bool), and a list of objects representing a particular question part. Each
  of these question part objects have the following fields: questionNum,
  partNum, active (bool), partPoints, and maxPoints. 
  """

  # Get the corresponding exam answer
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)

  # Get the questions and question answers. Will be used for the exam
  # navigation.
  questions = models.Question.objects.filter(exam=exam_answer.exam).order_by(
    'question_number', 'part_number')

  exam_to_return = {
      'points': 0,
      'maxPoints': 0,
      'graded': True,
      'questions': [],
      'examAnswerId': exam_answer_id
  }

  cur_question = 0

  for question in questions:
    if question.question_number != cur_question:
      new_question = {}
      new_question['questionNumber'] = question.question_number
      exam_to_return['questions'].append(new_question)
      cur_question += 1

    cur_last_question = exam_to_return['questions'][-1]
    if 'parts' not in cur_last_question:
      cur_last_question['parts'] = []
    
    cur_last_question['parts'].append({})
    part = cur_last_question['parts'][-1]
    part['partNumber'] = question.part_number
    part['graded'] = False

    # Set active field
    part['active'] = False
    if (question.question_number == int(question_number) and
        question.part_number == int(part_number)):
      part['active'] = True

    part['maxPartPoints'] = question.max_points
    exam_to_return['maxPoints'] += question.max_points

    # Set the part points. We are assuming that we are grading up.
    part['partPoints'] = question.max_points  # Only works for grading up.
    graded_rubrics = models.GradedRubric.objects.filter(question=question,
      question_answer__exam_answer=exam_answer)
    for graded_rubric in graded_rubrics:
      part['graded'] = True
      if graded_rubric.rubric is not None:
        part['partPoints'] += graded_rubric.rubric.points
      else:  # TODO: Error-handling if for some reason both are null?
        part['partPoints'] += graded_rubric.custom_points

    # Set the grader.
    question_answer = shortcuts.get_object_or_404(models.QuestionAnswer,
      question=question, exam_answer=exam_answer)
    if question_answer.grader is not None:
      part['grader'] = question_answer.grader.user.get_full_name()

    # Update the overall exam
    if not part['graded']:  # If a part is ungraded, the exam is ungraded
      exam_to_return['graded'] = False
    else:  # If a part is graded, update the overall exam points
      exam_to_return['points'] += part['partPoints']

  return exam_to_return


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
    exam_page.page_jpeg.save('new', File(temp_jpeg))
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
    exam_pdf_field.save('new', File(f))
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


def _render(request, template, data={}):
  """
  Renders the template for the given request, passing in the provided data.
  Adds extra data attributes common to all templates.
  """
  # fetch all courses this user is in
  if request.user.is_authenticated():
    course_users = models.CourseUser.objects.filter(user=request.user.pk)
    courses = map(lambda course_user: course_user.course, course_users)
  else:
    courses = []

  extra_data = {
    'courses': courses,
    'path': request.path,
    'user': request.user,
    'is_authenticated': request.user.is_authenticated(),
    'year': timezone.now().year,
  }
  extra_data.update(data)

  return shortcuts.render(request, template, extra_data)
