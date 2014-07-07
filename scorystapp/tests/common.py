from django.contrib.auth import get_user_model

PASSWORD = 'demo'

def create_user(name='Demo', is_signed_up=False):
  """ Creates a user with specified name and email `name`@scoryst.com """
  password = PASSWORD
  user = get_user_model().objects.create_user('%s@scoryst.com' % name,
    name, 'User','12345678', password, is_signed_up=is_signed_up)
  return user, password
