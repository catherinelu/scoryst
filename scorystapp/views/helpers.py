from scorystapp import models
from django import shortcuts
from django.utils import timezone
from django.conf import settings
from django.db.models import Q

def render(request, template, data={}, **kwargs):
  """
  Renders the template for the given request, passing in the provided data.
  Adds extra data attributes common to all templates.
  """

  extra_data = get_extra_context(request)
  extra_data.update(data)
  return shortcuts.render(request, template, extra_data, **kwargs)


def get_extra_context(request):
  """ Returns a dict of the extra context corresponding to the request. """
  is_authenticated = request.user.is_authenticated()

  # fetch all courses this user is in
  if is_authenticated:
    courses_staff = (models.Course.objects.filter(
      Q(courseuser__user=request.user.pk),
      Q(courseuser__privilege=models.CourseUser.INSTRUCTOR) |
      Q(courseuser__privilege=models.CourseUser.TA)
    ).prefetch_related('assessment_set'))

    courses_student = (models.Course.objects.filter(
      Q(courseuser__user=request.user.pk),
      Q(courseuser__privilege=models.CourseUser.STUDENT)
    ).prefetch_related('assessment_set'))

    courses_staff = list(courses_staff)
    for course in courses_staff:
      course.is_staff = True

    courses_student = list(courses_student)
    for course in courses_student:
      course.is_staff = False

    all_courses = courses_staff + courses_student
    courses = sorted(all_courses, key=lambda course: course.pk, reverse=True)

    user = shortcuts.get_object_or_404(models.User, id=request.user.pk)
    name = user.first_name
  else:
    courses = []
    name = ''

  show_banner = False
  for course in courses:
    if course.id < 16:
      show_banner = True

  extra_context = {
    'debug': settings.DEBUG,
    'courses': courses,
    'path': request.path,
    'user': request.user,
    'name': name,
    'is_authenticated': is_authenticated,
    'year': timezone.now().year,
    'is_instructor': is_authenticated and request.user.is_instructor_for_any_course(),
    'show_banner': show_banner
  }

  return extra_context
