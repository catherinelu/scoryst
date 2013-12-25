from django import shortcuts, http
from classallyapp import forms
from classallyapp.views import helpers
from django.contrib import auth

def login(request, redirect_path):
  """ Allows the user to log in. """
  # redirect path is relative to root
  redirect_path = '/%s' % redirect_path

  if request.user.is_authenticated():
    return shortcuts.redirect(redirect_path)

  if request.method == 'POST':
    form = forms.UserLoginForm(request.POST)

    if form.is_valid():
      # authentication should pass cleanly (already checked by UserLoginForm)
      user = auth.authenticate(username=form.cleaned_data['email'],
        password=form.cleaned_data['password'])
      auth.login(request, user)

      return shortcuts.redirect(redirect_path)
  else:
    form = forms.UserLoginForm()

  return helpers.render(request, 'login.epy', {
    'title': 'Login',
    'login_form': form,
  })


# TODO: docs
def logout(request):
  auth.logout(request)
  return shortcuts.redirect('/login')
