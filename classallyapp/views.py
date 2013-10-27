from classallyapp import models
from django.http import HttpResponse
from django.shortcuts import render

def index(request):
    return render(request, 'index.html')

def userform(request):
	return models.UserForm()