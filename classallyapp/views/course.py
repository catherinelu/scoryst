from classallyapp import models, forms, decorators
from classallyapp.views import helpers

@decorators.login_required
@decorators.instructor_for_any_course_required
def new_course(request):
  """ Allows the user to create a new course to grade. """
  if request.method == 'POST':
    form = forms.CourseForm(request.POST)

    if form.is_valid():
      course = form.save()
      course_user = models.CourseUser(user=request.user,
          course=course, privilege=models.CourseUser.INSTRUCTOR)
      course_user.save()
  else:
    form = forms.CourseForm()

  return helpers.render(request, 'new-course.epy', {
    'title': 'New Course',
    'new_course_form': form,
  })
