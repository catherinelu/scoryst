from classallyapp.models import User, Course, Exam, Question, Rubric
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


class CourseForm(ModelForm):
  class Meta:
    model = Course


class ExamUploadForm(Form):
  exam_name = forms.CharField(max_length=100)
  exam_file = forms.FileField(required=False)
  exam_solutions_file = forms.FileField(required=False)

  def clean(self):
    # 10MB
    MAX_ALLOWABLE_PDF_SIZE = 1024 * 1024 * 10
    data = self.cleaned_data
    exam_file = data.get('exam_file')
    exam_solutions_file = data.get('exam_solutions_file')
    
    if exam_file:
      if exam_file.size > MAX_ALLOWABLE_PDF_SIZE:
        raise forms.ValidationError('Max size allowed is %s bytes but file size is %s bytes' %
                                    (MAX_ALLOWABLE_PDF_SIZE, exam_file.size))
      
      # TODO: Anyone can forge this. Ensure file is pdf by examining the header
      if 'pdf' not in exam_file.content_type:
        raise forms.ValidationError('Only PDF files are acceptable')
    
    if exam_solutions_file:
      if exam_solutions_file.size > MAX_ALLOWABLE_PDF_SIZE:
        raise forms.ValidationError('Max size allowed is %s bytes but solution size is %s bytes' %
                                    (MAX_ALLOWABLE_PDF_SIZE, exam_solutions_file.size))
      if 'pdf' not in exam_solutions_file.content_type:
        raise forms.ValidationError('Only PDF files are acceptable')
    return data


class QuestionForm(ModelForm):
  class Meta:
    model = Question
    exclude = ('exam',)


class RubricForm(ModelForm):
  class Meta:
    model = Rubric
    exclude = ('question',)
