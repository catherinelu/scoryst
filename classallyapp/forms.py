from classallyapp.models import User, Class, Test, Question, Rubric
from django import forms
from django.forms import Form, ModelForm

class UserSignupForm(Form):
	username = forms.CharField(max_length=200)
	password = forms.CharField(max_length=200)
	college_student_id = forms.IntegerField()
	college_username = forms.CharField(max_length=200)

class UserLoginForm(Form):
	username = forms.CharField(label='Email', max_length=200)
	password = forms.CharField(widget=forms.PasswordInput)

class ClassForm(ModelForm):
	class Meta:
		model = Class

class TestForm(ModelForm):
	class Meta:
		model = Test
		field = ('test_name',)

class QuestionForm(ModelForm):
	class Meta:
		model = Question
		exclude = ('test_id',)

class RubricForm(ModelForm):
	class Meta:
		model = Rubric
		exclude = ('question_id',)