from classallyapp import models
from classallyapp.forms import UserSignupForm, UserLoginForm
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
def upload_exam(request):
  if request.method == 'POST':
    # TODO:
    pass
  else:
    return _render(request, 'upload-exam.epy', {'title': 'Upload'})


@login_required
def create_exam(request):
  if request.method == 'POST':
    # TODO:
    pass
  else:
    return _render(request, 'create-exam.epy', {'title': 'Create'})


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
