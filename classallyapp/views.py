from classallyapp import models
from classallyapp.forms import UserSignupForm, UserLoginForm
from django.contrib import messages
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import render
from django.template import Context

def index(request):
	if request.method == 'POST':
		form = UserLoginForm(request.POST)
		if form.is_valid():
			user = authenticate(username=request.POST['username'],
				password=request.POST['password'])
			if user is not None:
				if user.is_active:
					login(request, user)
					return HttpResponse(content='User is valid, active and authenticated', status=200)
				else:  # Account is not yet enabled
					return HttpResponse(content='Account is not enabled', status=400)
			else:
				return HttpResponse(content='The username and password combo does not exist', status=400)
		else:
			return HttpResponse(content='Invalid form field(s)', status=400)
	elif not request.user.is_authenticated():
		user_login_form = UserLoginForm
		return render(request, 'index.html', Context({'login_form': user_login_form}))
	else:
		return HttpResponse(content='You are successfully logged in', status=200)

def redirect_to_login(request):
	return render(request, 'index.html', {'message' : 'Please sign in'})

@login_required
def grade(request):
	return render(request, 'grade.html')

@login_required
def grade_exam(request):
	return render(request, '')

def dashboard(request):
    return render(request, 'dashboard.epy', { 'title': 'Dashboard' })
