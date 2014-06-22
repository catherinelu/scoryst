from django import shortcuts, http
from scorystapp import decorators, forms, models
from scorystapp.views import helpers, email_sender
from django.contrib import auth
from django.contrib.auth import views


def _get_redirect_path(request, redirect_path, user):
  """ Returns the correct redirect path, if any, from login. """
  if redirect_path:
    # redirect path is relative to root
    redirect_path = '/%s' % redirect_path
  else:
    course_users = models.CourseUser.objects.filter(user=user).order_by('-course__id')
    if course_users:
      if course_users[0].privilege == models.CourseUser.STUDENT:
        redirect_path = '/course/%d/assessments/view/' % course_users[0].course.pk
      else:
        redirect_path = '/course/%d/roster/' % course_users[0].course.pk
    else:
      redirect_path = '/about/'

  return redirect_path


def login(request, redirect_path=None):
  """ Allows the user to log in. """

  if request.user.is_authenticated():
    return shortcuts.redirect(_get_redirect_path(request, redirect_path, request.user))

  if request.method == 'POST':
    form = forms.UserLoginForm(request.POST)

    if form.is_valid():
      # authentication should pass cleanly (already checked by UserLoginForm)
      user = auth.authenticate(username=form.cleaned_data['email'],
        password=form.cleaned_data['password'])
      auth.login(request, user)
      return shortcuts.redirect(_get_redirect_path(request, redirect_path, user))
  else:
    form = forms.UserLoginForm()

  # If the redirect path is of the form enroll-ta/ or enroll/, this means
  # the user is trying to enroll in a class. In such a case, we must make clear
  # to the user that the user will be added to the course after the user logs in
  # If `course_name` is not None, then login.epy will display the appropriate message
  if redirect_path and 'enroll-ta' in redirect_path:
    token = redirect_path.lstrip('enroll-ta/').rstrip('/')
    course = shortcuts.get_object_or_404(models.Course, ta_enroll_token=token)
    course_name = course.name
  elif redirect_path and 'enroll' in redirect_path:
    token = redirect_path.lstrip('enroll/').rstrip('/')
    course = shortcuts.get_object_or_404(models.Course, student_enroll_token=token)
    course_name = course.name
  else:
    course_name = None

  return helpers.render(request, 'login.epy', {
    'title': 'Login',
    'login_form': form,
    'course_name': course_name
  })


def logout(request):
  """ Allows the user to log out. """
  auth.logout(request)
  return shortcuts.redirect('/login')


def sign_up(request):
  """ Allows the user to create an account on Scoryst. """
  if request.method == 'POST':
    form = forms.UserSignupForm(request.POST)
    if form.is_valid():
      email = form.cleaned_data.get('email')
      first_name = form.cleaned_data.get('first_name')
      last_name = form.cleaned_data.get('last_name')
      student_id = form.cleaned_data.get('student_id')
      user = auth.get_user_model().objects.create_user(email, first_name, last_name, student_id)

      # Send an email to confirm sign up and ask the user to set a password
      # user.is_signed_up will be False till then
      email_sender.send_sign_up_done(request, user)

      return helpers.render(request, 'sign-up-done.epy', {
        'title': 'Sign up Successful'
      })
  else:
    form = forms.UserSignupForm()

  return helpers.render(request, 'sign-up.epy', {
    'title': 'Sign up',
    'sign_up_form': form,
  })


@decorators.login_required
def change_password(request):
  """ Allows the user to reset his/her password. """
  extra_context = helpers.get_extra_context(request)
  extra_context['title'] = 'Change Password'
  return views.password_change(request, template_name='reset/password-change-form.epy',
    extra_context=extra_context, post_change_redirect='done',
    password_change_form=forms.PasswordWithMinLengthChangeForm)


@decorators.login_required
def done_change_password(request):
  """ Confirmation page that password is successfully changed. """
  extra_context = helpers.get_extra_context(request)
  extra_context['title'] = 'Password Change Done'
  return views.password_change_done(request, template_name='reset/password-change-done.epy',
    extra_context=extra_context)
