from classallyapp import models
from classallyapp.forms import UserSignupForm, UserLoginForm
from django.contrib import messages
from django.contrib import auth
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.core.urlresolvers import reverse

def login(request):
  if request.user.is_authenticated():
    # TODO: change this to use reverse()
    return redirect('/dashboard')

  if request.method == 'POST':
    form = UserLoginForm(request.POST)

    if form.is_valid():
      # authentication should pass cleanly (already checked by UserLoginForm)
      user = auth.authenticate(username=form.cleaned_data['email'],
        password=form.cleaned_data['password'])
      auth.login(request, user)

      # TODO: change this to use reverse()
      return redirect('/dashboard')
  else:
    form = UserLoginForm()

  return render(request, 'login.epy', {
    'title': 'Login',
    'login_form': form
  })

def redirect_to_login(request):
  # TODO: do I have to specify the entire app name here?
  return redirect(reverse('classallyapp.views.login'))

@login_required
def grade(request):
  return render(request, 'grade.html')

@login_required
def grade_exam(request):
  return render(request, '')

@login_required
def dashboard(request):
  return render(request, 'dashboard.epy', {'title': 'Dashboard'})
