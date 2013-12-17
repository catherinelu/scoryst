from classallyapp import models, forms, decorators
from django import shortcuts, http
from django.contrib import messages, auth
from django.contrib.auth import decorators as django_decorators
from django.core import serializers
from django.core.urlresolvers import reverse
from django.utils import timezone, simplejson
import json
import random
import string


def login(request):
  if request.user.is_authenticated():
    # TODO: change this to use reverse()
    return shortcuts.redirect('/new-course')

  if request.method == 'POST':
    form = forms.UserLoginForm(request.POST)

    if form.is_valid():
      # authentication should pass cleanly (already checked by UserLoginForm)
      user = auth.authenticate(username=form.cleaned_data['email'],
        password=form.cleaned_data['password'])
      auth.login(request, user)

      # TODO: change this to use reverse()
      return shortcuts.redirect('/new-course')
  else:
    form = forms.UserLoginForm()

  return _render(request, 'login.epy', {
    'title': 'Login',
    'login_form': form,
  })


def logout(request):
  auth.logout(request)
  return shortcuts.redirect('/')


def new_course(request):
  """ Allows the user to create a new course to grade. """
  if request.method == 'POST':
    form = forms.CourseForm(request.POST)

    if form.is_valid():
      course = form.save()
      course_user = models.CourseUser(user=request.user,
          course=course, privilege=models.CourseUser.SUPER_TA)
  else:
    form = forms.CourseForm()

  return _render(request, 'new-course.epy', {
    'title': 'New Course',
    'new_course_form': form,
  })

def redirect_to_login(request):
  # TODO: do I have to specify the entire app name here?
  return shortcuts.redirect(reverse('classallyapp.views.login'))


@django_decorators.login_required
@decorators.valid_course_required
def grade(request, cur_course_user, exam_answer_id):
  # TODO: Pass in dynamic course name and student name
  return _render(request, 'grade.epy', {'title': 'Grade', 'course': 'CS144',
    'studentName': 'First Last'})


# TODO: don't prefix this with ajax, both in the view and urls.py
@django_decorators.login_required
@decorators.valid_course_required
def ajax_get_rubrics(request, cur_course_user, exam_answer_id, question_number,
    part_number):
  """
  Returns rubrics, merged from rubrics and graded rubrics, associated with the
  particular question number and part number as JSON for the grade.js AJAX call.

  The resulting rubrics have the following fields: description, points, custom
  (bool), and selected (bool).
  """
  # Get the corresponding exam answer
  try:
    exam_answer = models.ExamAnswer.objects.get(pk=exam_answer_id)
  except models.ExamAnswer.DoesNotExist:
    return http.HttpResponse(status=422)

  # Get the question corresponding to the question number and part number
  try:
    question = models.Question.objects.get(exam=exam_answer.exam_id,
      question_number=question_number, part_number=part_number)
  except models.Question.DoesNotExist:
    return http.HttpResponse(status=422)

  # Get the rubrics and graded rubrics associated with the particular exam and
  # question part.
  rubrics = models.Rubric.objects.filter(question=question
    ).order_by('question__question_number', 'question__part_number', 'id')
  graded_rubrics = models.GradedRubric.objects.filter(question=question
    ).order_by('question__question_number', 'question__part_number', 'id')

  rubrics_to_return = {}
  rubrics_to_return['rubrics'] = []
  rubrics_to_return['graded'] = False
  rubrics_to_return['points'] = question.max_points
  rubrics_to_return['maxPoints'] = question.max_points

  # Merge the rubrics and graded rubrics into a list of rubrics (represented as
  # dicts) with the following fields: description, points, custom, and selected.
  for rubric in rubrics:
    cur_rubric = {}
    cur_rubric['description'] = rubric.description
    cur_rubric['points'] = rubric.points
    cur_rubric['custom'] = False
    cur_rubric['selected'] = False
    # Iterate over graded rubrics and check if it is actually selected.
    # TODO: Make more efficient than O(N^2)?
    for graded_rubric in graded_rubrics:
      if graded_rubric.rubric == rubric:
        cur_rubric['selected'] = True
        break
    rubrics_to_return['rubrics'].append(cur_rubric)

  for graded_rubric in graded_rubrics:
    rubrics_to_return['graded'] = True
    # Check to see if there is a custom rubric.
    if graded_rubric.custom_points != None:
      rubrics_to_return['points'] += graded_rubric.custom_points
      cur_rubric['description'] = 'Custom points'
      cur_rubric['custom'] = True
      cur_rubric['points'] = graded_rubric.custom_points
      cur_rubric['selected'] = True
      rubrics_to_return['rubrics'].append(cur_rubric)
    else:
      rubrics_to_return['points'] += graded_rubric.rubric.points

  # Add in the comment field
  try:
    question_answer = models.QuestionAnswer.objects.get(exam_answer=exam_answer,
      question=question)
  except models.QuestionAnswer.DoesNotExist:
    return http.HttpResponse(status=422)

  if len(question_answer.grader_comments) > 0:
    rubrics_to_return['graderComments'] = question_answer.grader_comments
    rubrics_to_return['grader'] = (question_answer.grader.user.first_name + ' '
      + question_answer.grader.user.last_name)

  return http.HttpResponse(json.dumps(rubrics_to_return),
    mimetype='application/json')


@django_decorators.login_required
@decorators.valid_course_required
def ajax_get_exam_summary(request, cur_course_user, exam_answer_id,
    question_number, part_number):
  """
  Returns the questions and question answers as JSON to the grade.js AJAX call.

  The resulting questions have the following fields: points, maxPoints, graded
  (bool), and a list of objects representing a particular question part. Each
  of these question part objects have the following fields: questionNum,
  partNum, active (bool), partPoints, and maxPoints. 
  """

  # Get the corresponding exam answer
  try:
    exam_answer = models.ExamAnswer.objects.get(pk=exam_answer_id)
  except models.ExamAnswer.DoesNotExist:
    return http.HttpResponse(status=422)

  # Get the questions and question answers. Will be used for the exam
  # navigation.
  questions = models.Question.objects.filter(exam=exam_answer.exam_id).order_by(
    'question_number', 'part_number')
  question_answers = models.QuestionAnswer.objects.filter(
    exam_answer=exam_answer_id)

  exam_to_return = {}
  exam_to_return['points'] = 0
  exam_to_return['maxPoints'] = 0
  exam_to_return['graded'] = True
  exam_to_return['questions'] = []

  cur_question = 0

  for q in questions:
    if q.question_number != cur_question:
      new_question = {}
      new_question['questionNumber'] = q.question_number
      exam_to_return['questions'].append(new_question)
      cur_question += 1

    question = exam_to_return['questions'][-1]  # Get the last question in array
    if 'parts' not in question:
      question['parts'] = []
    
    question['parts'].append({})
    part = question['parts'][-1]
    part['partNumber'] = q.part_number
    part['graded'] = False

    # Set active field
    part['active'] = False
    if (q.question_number == int(question_number) and
        q.part_number == int(part_number)):
      part['active'] = True

    # Set part points and overall max points
    part['maxPartPoints'] = q.max_points
    exam_to_return['maxPoints'] += q.max_points

    # Set the part points. We are assuming that we are grading up.
    part['partPoints'] = q.max_points  # Only works for grading up.
    graded_rubrics = models.GradedRubric.objects.filter(question=q)
    for graded_rubric in graded_rubrics:
      part['graded'] = True
      if graded_rubric is not None:
        part['partPoints'] += graded_rubric.rubric.points
      else:  # TODO: Error-handling if for some reason both are null?
        part['partPoints'] += graded_rubric.custom_points

    # Update the overall exam
    if not part['graded']:  # If a part is ungraded, the exam is ungraded
      exam_to_return['graded'] = False
    else:  # If a part is graded, update the overall exam points
      exam_to_return['points'] += part['partPoints']

  return http.HttpResponse(json.dumps(exam_to_return), mimetype='application/json')


@django_decorators.login_required
@decorators.valid_course_required
def roster(request, cur_course_user):
  """ Allows the user to manage a course roster. """
  cur_course = cur_course_user.course

  # TODO: confirm this is instructor
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
          password = _generate_random_string(50)
          user = models.User.objects.create_user(email, first_name, last_name,
            student_id, password)

          # TODO: send user password

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

@django_decorators.login_required
@decorators.valid_course_required
def delete_from_roster(request, cur_course_user, course_user_id):
  # TODO: confirm this is instructor
  cur_course = cur_course_user.course

  # TODO: does this ensure the course is cur_course, or does it just use the pk?
  models.CourseUser.objects.filter(pk=course_user_id, course=cur_course).delete()
  return shortcuts.redirect('/course/%d/roster' % cur_course.pk)


def _generate_random_string(length):
  """ Generates a random string with the given length """
  possible_chars = string.ascii_letters + string.digits
  char_list = [random.choice(possible_chars) for i in range(length)]
  return ''.join(char_list)


@django_decorators.login_required
@decorators.valid_course_required
def upload_exam(request, cur_course_user):
  if request.method == 'POST':
    # TODO: Ensure course_id is valid
    form = forms.ExamUploadForm(request.POST, request.FILES)
    if form.is_valid():
      # TODO: Get file path by storing on S3
      empty_file_path = 'TODO'
      sample_answer_path = 'TODO'

      cur_course = cur_course_user.course
      exam = models.Exam(course=cur_course, name=form.cleaned_data['exam_name'],
        empty_file_path=empty_file_path, sample_answer_path=sample_answer_path)
      exam.save()
      # TODO: change this to use reverse()
      return shortcuts.redirect('/create-exam/' + exam.id)
  else:
    form = forms.ExamUploadForm()

  return _render(request, 'upload-exam.epy', {
    'title': 'Upload',
    'form': form
  })


@django_decorators.login_required
@decorators.valid_course_required
def create_exam(request, cur_course_user, exam_id):
  if request.method == 'POST':
    # TODO: Discuss
    questions_json =  json.loads(request.POST['questions-json'])
    success, form_list = _validate_create_exam(questions_json)
    if not success:
      for error in form_list:
        messages.add_message(request, messages.INFO, error)
    else:
      exam = models.Exam.objects.get(pk=exam_id)
      # TODO: Does it delete those rubrics that have this as a foreign key?
      # If we are editing an existing exam, delete the previous one
      models.Questions.objects.filter(exam=exam).delete()
      for form_type, form in form_list:
        f = form.save(commit=False)
        if form_type == "question":
          f.exam = exam
          f.save()
          question = models.Question.objects.get(pk=f.id)
        else:
          f.question = question
          f.save()
  return _render(request, 'create-exam.epy', {'title': 'Create'})


# Validates the questions_json and adds the 'forms' to form_list
# If this function returns successfully, form_list will be a list of tuples
# where each tuple is: ('question' | 'rubric', form)
# We can then save the form, add the foreign keys and then commit it
# Returns:
# True, form_list if validation was successful
# False, errors_list if validation failed
def _validate_create_exam(questions_json):
  form_list = []
  question_number = 0
  # Loop over all the questions
  for question in questions_json:
    question_number += 1
    part_number = 0
    # Loop over all the parts
    for part in question:
      part_number += 1
      # Create the json needed for QuestionForm validation
      question_form_json = {
        'question_number': question_number,
        'part_number': part_number,
        'max_points': part['points'],
        'pages': (',').join(map(str, part['pages']))
      }
      form = forms.QuestionForm(question_form_json)
      if form.is_valid():
        form_list.append(('question', form))
      else:
        return False, form.errors.values()
      for rubric in part['rubrics']:
        rubric_json = {
          'description': rubric['description'],
          'points': rubric['points']
        }
        form = forms.RubricForm(rubric_json)
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
