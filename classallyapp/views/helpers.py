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
    course_users_ta = (models.CourseUser.objects.filter(user=request.user.pk).
      exclude(privilege=models.CourseUser.STUDENT))
    courses_ta = map(lambda course_user_ta: course_user_ta.course, course_users_ta)

    course_users_student = models.CourseUser.objects.filter(user=request.user.pk, 
      privilege=models.CourseUser.STUDENT)
    courses_student = map(lambda course_user_student: course_user_student.course, course_users_student)
  else:
    courses_ta = []
    courses_student = []

  extra_data = {
    'courses_ta': courses_ta,
    'courses_student': courses_student,
    'path': request.path,
    'user': request.user,
    'is_authenticated': request.user.is_authenticated(),
    'year': timezone.now().year,
  }
  extra_data.update(data)

  return shortcuts.render(request, template, extra_data)
