from django import shortcuts
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


# TODO: What if the user
@decorators.login_required
def enroll_student(request, token):
  """ Allows a user to enroll as a student for a course. """
  course = shortcuts.get_object_or_404(models.Course, student_enroll_token=token)
  existing_course_user = models.objects.CourseUser.filter(user=request.user, course=course)

  # User is already enroll for the course
  if existing_course_user.length() > 0:
    if existing_course_user[0].privilege == models.CourseUser.STUDENT:
      return shortcuts.redirect('/TODO')
    else:
      return shortcuts.redirect('/course/%d/roster/' % course.pk)

  course_user = models.CourseUser(user=request.user,
       course=course, privilege=models.CourseUser.STUDENT)
  course_user.save()
  return shortcuts.redirect('/TODO')


@decorators.login_required
def enroll_ta(request, token):
  """ Allows a user to enroll as a TA for a course. """
  course = shortcuts.get_object_or_404(models.Course, ta_enroll_token=token)
  existing_course_user = models.objects.CourseUser.filter(user=request.user, course=course)

  # User is not already enroll for the course
  if existing_course_user.length() == 0:
    course_user = models.CourseUser(user=request.user,
      course=course, privilege=models.CourseUser.TA)
    course_user.save()
  # User is enroll but with the privelege of a student
  elif existing_course_user[0].privilege == models.CourseUser.STUDENT:
    existing_course_user[0].privilege = models.CourseUser.TA
    existing_course_user[0].save()

  return shortcuts.redirect('/course/%d/roster/' % course.pk)
