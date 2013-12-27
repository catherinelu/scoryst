from classallyapp import models
from django.core import mail
from django.contrib.sites.models import get_current_site
from django.template import loader
from django.utils import http
from django.contrib.auth.tokens import default_token_generator

# TODO(kvmohan): All 4 of the below functions can be, and should be combined into just one.

def _send_exam_graded_email_unregistered(request, course_users, exam, use_https=False):
  """
  Sends an email to each unregistered course_user telling him that the exam has
  been graded and asking them to set a password.
  """
  messages = []

  current_site = get_current_site(request)
  site_name = current_site.name
  domain = current_site.domain
  from_email = 'Scoryst <courses@%s>' % domain
  email_template_name = 'email/view-graded-exam-unregistered.epy'

  for course_user in course_users:
    user = course_user.user
    
    context = {
      'course': course_user.course,
      'email': user.email,
      'exam': exam,
      'domain': domain,
      'site_name': site_name,
      # uid and token are needed for security purposes for generating one-time
      # only reset links
      'uid': http.int_to_base36(user.pk),
      'user': user,
      'token': default_token_generator.make_token(user),
      'protocol': 'https' if use_https else 'http',
    }

    subject = '%s %s Grades' % (course_user.course.name, exam.name)
    email = loader.render_to_string(email_template_name, context)
    messages.append((subject, email, from_email, [user.email]))

  mail.send_mass_mail(tuple(messages))


def _send_exam_graded_email_registered(request, course_users, exam, use_https=False):
  """
  Sends an email to each registered course_user telling him that the exam has
  been graded.
  """
  messages = []

  current_site = get_current_site(request)
  site_name = current_site.name
  domain = current_site.domain
  from_email = 'Scoryst <courses@%s>' % domain
  email_template_name = 'email/view-graded-exam.epy'

  for course_user in course_users:
    user = course_user.user
    
    context = {
      'course': course_user.course,
      'email': user.email,
      'exam': exam,
      'domain': domain,
      'site_name': site_name,
      'user': user,
      'protocol': 'https' if use_https else 'http',
    }

    subject = '%s %s Grades' % (course_user.course.name, exam.name)
    email = loader.render_to_string(email_template_name, context)
    messages.append((subject, email, from_email, [user.email]))

  mail.send_mass_mail(tuple(messages))


def _send_added_to_course_email_registered(request, course_users, use_https=False):
  """
  Sends an email to each course_user telling him that he has been added as an instructor/TA etc.
  to the given course
  """
  messages = []

  current_site = get_current_site(request)
  site_name = current_site.name
  domain = current_site.domain
  from_email = 'Scoryst <courses@%s>' % domain
  email_template_name = 'email/added-to-course.epy'

  for course_user in course_users:
    user = course_user.user
    
    if course_user.privilege == models.CourseUser.TA:
      privilege = 'TA'
      article = 'a'
    elif course_user.privilege == models.CourseUser.INSTRUCTOR:
      privilege = 'instructor'
      article = 'an'
    else:
      privilege = 'student'
      article = 'a'

    context = {
      'article': article,
      'privilege': privilege,
      'course': course_user.course,
      'email': user.email,
      'domain': domain,
      'site_name': site_name,
      'user': user,
      'protocol': 'https' if use_https else 'http',
    }

    subject = 'You have been added to %s' % course_user.course.name
    email = loader.render_to_string(email_template_name, context)
    messages.append((subject, email, from_email, [user.email]))

  mail.send_mass_mail(tuple(messages))


def _send_added_to_course_email_unregistered(request, course_users, use_https=False):
  """
  Sends an email to each course_user telling him that he has been added as an instructor/TA etc.
  to the given course and also allows them to set their password
  """
  messages = []
  current_site = get_current_site(request)
  site_name = current_site.name
  domain = current_site.domain
  from_email = 'Scoryst <courses@%s>' % domain
  email_template_name = 'email/added-to-course-unregistered.epy'

  for course_user in course_users:
    user = course_user.user
    
    if int(course_user.privilege) == models.CourseUser.TA:
      privilege = 'TA'
      article = 'a'
    elif int(course_user.privilege) == models.CourseUser.INSTRUCTOR:
      privilege = 'instructor'
      article = 'an'
    else:
      privilege = 'student'
      article = 'a'

    context = {
      'article': article,
      'privilege': privilege,
      'course': course_user.course,
      'email': user.email,
      'domain': domain,
      'site_name': site_name,
      # uid and token are needed for security purposes for generating one-time
      # only reset links
      'uid': http.int_to_base36(user.pk),
      'user': user,
      'token': default_token_generator.make_token(user),
      'protocol': 'https' if use_https else 'http',
    }

    subject = 'You have been added to %s' % course_user.course.name
    email = loader.render_to_string(email_template_name, context)
    messages.append((subject, email, from_email, [user.email]))
  mail.send_mass_mail(tuple(messages))


def send_added_to_course_email(request, course_users, send_to_students=False):
  """
  Sends email to each course_user in course_users who is an instructor or a TA.
  Care is taken if course_user is unregistered
  """

  registered_course_users = []
  unregistered_course_users = []
  for course_user in course_users:
    # Don't send emails to students when added to roster unless send_to_students is true
    if int(course_user.privilege) != models.CourseUser.STUDENT or send_to_students:
      if course_user.user.is_signed_up:
        registered_course_users.append(course_user)
      else:
        unregistered_course_users.append(course_user)

  _send_added_to_course_email_unregistered(request, unregistered_course_users)
  _send_added_to_course_email_registered(request, registered_course_users)


def send_exam_graded_email(request, exam):
  """
  Sends an email to all students when exam corresponding to exam_id is graded
  """
  # TODO: What if a student exam is not fully graded. Do we still send the email?
  # TODO: The student might be a course user but didn't take the exam
  course_users = models.CourseUser.objects.filter(course=exam.course)
  registered_course_users = []
  unregistered_course_users = []
  for course_user in course_users:
    # Don't send emails that an exam is graded to instructors
    if int(course_user.privilege) == models.CourseUser.STUDENT:
      if course_user.user.is_signed_up:
        registered_course_users.append(course_user)
      else:
        unregistered_course_users.append(course_user)
  _send_exam_graded_email_unregistered(request, unregistered_course_users, exam)
  _send_exam_graded_email_registered(request, registered_course_users, exam)