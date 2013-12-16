from django.conf import settings
from django.contrib.auth.models import User

class EmailOrUsernameModelBackend(object):
  """ Allows a user to login with either an email or username. """

  def authenticate(self, username=None, password=None):
    """ Authenticates a user with the given username and password. """
    if '@' in username:
      # username is actually an email
      kwargs = { 'email': username }
    else:
      kwargs = { 'username': username }

    try:
      user = User.objects.get(**kwargs)
      if user.check_password(password):
        return user
    except User.DoesNotExist:
      return None

  def get_user(self, user_id):
    """ Retrieve the user with the given identifier. """
    try:
      return User.objects.get(pk=user_id)
    except User.DoesNotExist:
      return None
