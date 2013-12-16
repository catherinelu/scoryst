from classallyapp.models import User, Class, Exam, Question, Rubric
from django import forms
from django.forms import Form, ModelForm
from django.contrib.auth import authenticate

class UserSignupForm(Form):
  username = forms.CharField(max_length=100)
  password = forms.CharField(max_length=100)
  college_student_id = forms.IntegerField()
  college_username = forms.CharField(max_length=100)

class UserLoginForm(Form):
  email = forms.EmailField(max_length=100)
  password = forms.CharField(max_length=100, widget=forms.PasswordInput)
  
  def clean(self):
    """ Confirms the user provided valid credentials. """
    data = self.cleaned_data
    email = data.get('email')
    password = data.get('password')

    user = authenticate(username=email, password=password)
    if email and password:
      if user is None:
        raise forms.ValidationError('Invalid credentials.')
      elif not user.is_active:
        raise forms.ValidationError('User is not active.')
      elif not user.is_signed_up:
        raise forms.ValidationError('User is not signed up.')
    return data


class ClassForm(ModelForm):
  class Meta:
    model = Class

class ExamForm(ModelForm):
  class Meta:
    model = Exam
    field = ('exam_name',)

class QuestionForm(ModelForm):
  class Meta:
    model = Question
    exclude = ('exam_id',)

class RubricForm(ModelForm):
  class Meta:
    model = Rubric
    exclude = ('question_id',)
