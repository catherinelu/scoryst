from scorystapp import models
from django import shortcuts
from django.utils import timezone

def render(request, template, data={}):
  """
  Renders the template for the given request, passing in the provided data.
  Adds extra data attributes common to all templates.
  """

  extra_data = get_extra_context(request)
  extra_data.update(data)
  return shortcuts.render(request, template, extra_data)


def get_extra_context(request):
  """ Returns a dict of the extra context corresponding to the request. """
  # fetch all courses this user is in
  if request.user.is_authenticated():
    course_users_ta = (models.CourseUser.objects.filter(user=request.user.pk).
      exclude(privilege=models.CourseUser.STUDENT))
    courses_ta = map(lambda course_user_ta: course_user_ta.course, course_users_ta)

    course_users_student = models.CourseUser.objects.filter(user=request.user.pk, 
      privilege=models.CourseUser.STUDENT)
    courses_student = map(lambda course_user_student: course_user_student.course, course_users_student)

    user = shortcuts.get_object_or_404(models.User, id=request.user.pk)
    name = user.first_name
  else:
    courses_ta = []
    courses_student = []
    name = ''

  # is_instructor is true if the user is an instuctor for at least one course,
  # false otherwise. Uses the count method for efficiency.
  is_instructor = models.CourseUser.objects.filter(user=request.user.id,
    privilege=models.CourseUser.INSTRUCTOR).count() > 0
  is_instructor = is_instructor or request.user.is_superuser

  extra_context = {
    'courses_ta': courses_ta,
    'courses_student': courses_student,
    'path': request.path,
    'user': request.user,
    'name': name,
    'is_authenticated': request.user.is_authenticated(),
    'year': timezone.now().year,
    'is_instructor': is_instructor
  }

  return extra_context
