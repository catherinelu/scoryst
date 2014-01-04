from django import http, shortcuts
from scorystapp import models, forms, decorators, utils
from scorystapp.views import helpers, send_email

@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_required
def roster(request, cur_course_user):
  """ Allows the instructor to manage a course roster. """
  cur_course = cur_course_user.course

  if request.method == 'POST':
    form = forms.AddPeopleForm(request.POST)

    if form.is_valid():
      people = form.cleaned_data.get('people')
      privilege = form.cleaned_data.get('privilege')

      course_users = []
      for person in people.splitlines():
        first_name, last_name, email, student_id = person.split(',')

        # for each person, find/create a corresponding user
        try:
          user = models.User.objects.get(email=email)
        except models.User.DoesNotExist:
          password = utils._generate_random_string(50)
          user = models.User.objects.create_user(email, first_name, last_name,
            student_id, password)
        else:
          # update existing user's student ID to match entered value
          user.student_id = student_id
          user.save()

        try:
          course_user = models.CourseUser.objects.get(user=user.pk, course=cur_course.pk)
        except models.CourseUser.DoesNotExist:
          # add that user to the course
          course_user = models.CourseUser(user=user, course=cur_course,
            privilege=privilege)
        else:
          # if the user is already in the course, simply update his/her privileges
          course_user.privilege = privilege

        course_user.save()
        course_users.append(course_user)

      send_email.send_added_to_course_email(request, course_users)
      return shortcuts.redirect(request.path)
  else:
    form = forms.AddPeopleForm()

  course_users = models.CourseUser.objects.filter(course=cur_course.pk)
  return helpers.render(request, 'roster.epy', {
    'title': 'Roster',
    'add_people_form': form,
    'course': cur_course,
    'course_users': course_users,
  })


@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_required
def edit_roster(request, cur_course_user):
  """ Re-save all the fields for the particular field in the roster. """
  # TODO: What if method is not POST?
  # TODO: What if POST methods not found?
  course_user_id = request.POST['course_user_id']
  course_user = shortcuts.get_object_or_404(models.CourseUser, pk=course_user_id)
  course_user.user.first_name = request.POST['first_name']
  course_user.user.last_name = request.POST['last_name']
  course_user.user.student_id = request.POST['student_id']
  for num, privilege in models.CourseUser.USER_PRIVILEGE_CHOICES:
    if privilege == request.POST['privilege']:
      course_user.privilege = num
      break
  course_user.save()
  course_user.user.save()
  return http.HttpResponse(status=204)


@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_required
def delete_from_roster(request, cur_course_user, course_user_id):
  """ Allows the instructor to delete a user from the course roster. """
  cur_course = cur_course_user.course
  models.CourseUser.objects.filter(pk=course_user_id, course=cur_course.pk).delete()
  return shortcuts.redirect('/course/%d/roster' % cur_course.pk)
