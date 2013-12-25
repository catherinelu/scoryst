from classallyapp import models
from django import shortcuts
from django.utils import timezone

def render(request, template, data={}):
  """
  Renders the template for the given request, passing in the provided data.
  Adds extra data attributes common to all templates.
  """
  # fetch all courses this user is in
  if request.user.is_authenticated():
    course_users = models.CourseUser.objects.filter(user=request.user.pk)
    courses = map(lambda course_user: course_user.course, course_users)
  else:
    courses = []

  extra_data = {
    'courses': courses,
    'path': request.path,
    'user': request.user,
    'is_authenticated': request.user.is_authenticated(),
    'year': timezone.now().year,
  }
  extra_data.update(data)

  return shortcuts.render(request, template, extra_data)
