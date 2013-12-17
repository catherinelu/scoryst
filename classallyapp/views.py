from classallyapp import models
from classallyapp.forms import UserSignupForm, UserLoginForm, ExamUploadForm, QuestionForm, RubricForm
from django import shortcuts
from django.contrib import messages
from django.contrib import auth
from django.contrib.auth.decorators import login_required
from django.core import serializers
from django.core.urlresolvers import reverse
from django.http import HttpResponse
from django.utils import timezone, simplejson
import json


def login(request):
  if request.user.is_authenticated():
    # TODO: change this to use reverse()
    return shortcuts.redirect('/dashboard')

  if request.method == 'POST':
    form = UserLoginForm(request.POST)

    if form.is_valid():
      # authentication should pass cleanly (already checked by UserLoginForm)
      user = auth.authenticate(username=form.cleaned_data['email'],
        password=form.cleaned_data['password'])
      auth.login(request, user)

      # TODO: change this to use reverse()
      return shortcuts.redirect('/dashboard')
  else:
    form = UserLoginForm()

  return _render(request, 'login.epy', {
    'title': 'Login',
    'login_form': form
  })


def logout(request):
  auth.logout(request)
  return shortcuts.redirect('/')


def redirect_to_login(request):
  # TODO: do I have to specify the entire app name here?
  return shortcuts.redirect(reverse('classallyapp.views.login'))


@login_required
def grade(request):
  return _render(request, 'grade.epy', {'title': 'Grade'})


# Returns rubrics nav JSON to the grade.js AJAX call.
def get_rubrics_nav(request):
  exam_answer_id = int(request.path.split('/')[2])
  question_num = int(request.GET['question'])
  part_num = int(request.GET['part'])

  exam_id = models.ExamAnswer.objects.get(pk=exam_answer_id).exam_id
  question = models.Question.objects.get(exam=exam_id, number=question_num, part=part_num)

  # Get the rubrics and graded rubrics associated with the particular exam and
  # question part.
  rubrics = models.Rubric.objects.filter(question=question).order_by('question__number', 'question__part')
  graded_rubrics = models.GradedRubric.objects.filter(question=question).order_by('question__number', 'question__part')

  # Serialize to JSON.
  rubrics_json = serializers.serialize('json', rubrics)
  graded_rubrics_json = serializers.serialize('json', graded_rubrics)

  return HttpResponse(json.dumps({'rubrics': rubrics_json, 'graded_rubrics': graded_rubrics_json}), mimetype='application/json')


# Returns exam nav JSON to the grade.js AJAX call.
def get_exam_nav(request):
  exam_answer_id = int(request.path.split('/')[2])
  question_num = int(request.GET['question'])
  part_num = int(request.GET['part'])

  exam_id = models.ExamAnswer.objects.get(pk=exam_answer_id).exam_id

  # Get the questions and question answers.
  questions = models.Question.objects.filter(exam=exam_id)
  question_answers = models.QuestionAnswer.objects.filter(exam_answer=exam_answer_id)

  # Serialize to JSON.
  questions_json = serializers.serialize('json', questions)
  question_answers_json = serializers.serialize('json', question_answers)

  return HttpResponse(json.dumps({'questions': questions_json, 'question_answers': question_answers_json}), mimetype='application/json')


@login_required
def dashboard(request):
  return _render(request, 'dashboard.epy', {'title': 'Dashboard'})


@login_required
def upload_exam(request, course_id=None):
  if request.method == 'POST':
    # TODO: Ensure course_id is valid
    form = ExamUploadForm(request.POST, request.FILES)
    if form.is_valid():
      # TODO: Get file path by storing on S3
      empty_file_path = 'TODO'
      sample_answer_path = 'TODO'
      course = models.Course.objects.get(pk=course_id)
      exam = models.Exam(course=course, name=form.cleaned_data['exam_name'],
                         empty_file_path=empty_file_path, sample_answer_path=sample_answer_path)
      exam.save()
      # TODO: change this to use reverse()
      return shortcuts.redirect('/create-exam/' + exam.id)
  else:
    form = ExamUploadForm()

  return _render(request, 'upload-exam.epy', {
    'title': 'Upload',
    'form': form
  })


@login_required
def create_exam(request, exam_id):
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
      form = QuestionForm(question_form_json)
      if form.is_valid():
        form_list.append(('question', form))
      else:
        return False, form.errors.values()
      for rubric in part['rubrics']:
        rubric_json = {
          'description': rubric['description'],
          'points': rubric['points']
        }
        form = RubricForm(rubric_json)
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
  extra_data = {
    'path': request.path,
    'user': request.user,
    'year': timezone.now().year,
  }
  extra_data.update(data)
  return shortcuts.render(request, template, extra_data)
