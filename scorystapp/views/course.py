from django import shortcuts, http
from scorystapp import models, forms, decorators, utils
from scorystapp.views import helpers


@decorators.login_required
@decorators.instructor_for_any_course_required
def new_course(request):
  """ Allows the user to create a new course to grade. """
  if request.method == 'POST':
    form = forms.CourseForm(request.POST)

    if form.is_valid():
      # `commit=False` implies it won't be saved. We do this so that we can
      # add the token
      course = form.save(commit=False)
      course.student_enroll_token = utils.generate_random_string(8)
      course.ta_enroll_token = utils.generate_random_string(8)
      course.save()

      course_user = models.CourseUser(user=request.user,
          course=course, privilege=models.CourseUser.INSTRUCTOR)

      course_user.save()
      return shortcuts.redirect('/course/%d/roster/' % course.pk)
  else:
    form = forms.CourseForm()

  return helpers.render(request, 'new-course.epy', {
    'title': 'New Course',
    'new_course_form': form,
  })


def _get_course_and_privilege_from_token(token):
  """
  Returns a course for which the given token is valid and the privilege (TA or student)
  corresponding to the token. Returns None if token is invalid.
  """
  course = None
  privilege = None

  try:
    course = models.Course.objects.get(student_enroll_token=token)
    privilege = models.CourseUser.STUDENT
  except models.Course.DoesNotExist:
    pass

  try:
    course = models.Course.objects.get(ta_enroll_token=token)
    privilege = models.CourseUser.TA
  except models.Course.DoesNotExist:
    pass

  return course, privilege


@decorators.login_required
def enroll(request, token):
  """ Allows the user to enroll as a student or TA in a course using the token. """
  course, privilege = _get_course_and_privilege_from_token(token)
  if course == None:
    raise http.Http404

  existing_course_user = models.CourseUser.objects.filter(user=request.user, course=course)

  # User is already enroll for the course
  if existing_course_user.count() > 0:
    course_user = existing_course_user[0]
    if (course_user.privilege == models.CourseUser.STUDENT and
        privilege == models.CourseUser.STUDENT):
      return shortcuts.redirect('/welcome')
    elif (course_user.privilege == models.CourseUser.STUDENT and
        privilege == models.CourseUser.TA):
      # This means the user is being changed to TA privilege
      course_user.privilege = models.CourseUser.TA
      course_user.save()
      return shortcuts.redirect('/course/%d/roster/' % course.pk)
    else:
      return shortcuts.redirect('/course/%d/roster/' % course.pk)

  course_user = models.CourseUser(user=request.user,
       course=course, privilege=privilege)
  course_user.save()

  if privilege == models.CourseUser.STUDENT:
    return shortcuts.redirect('/welcome')
  else:
    return shortcuts.redirect('/course/%d/roster/' % course.pk)
