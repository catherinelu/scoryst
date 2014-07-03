"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test scorystapp".
"""

from django.test import TestCase
from django.core import mail
from model_mommy import mommy
from model_mommy.recipe import Recipe, foreign_key
from scorystapp import models
from django.contrib.auth import get_user_model
from django.test.client import Client


def _create_user(name='Demo', is_signed_up=False):
  """ Creates a user """
  password = 'demo'
  user = get_user_model().objects.create_user('%s@scoryst.com' % name,
    name, 'User','12345678', password, is_signed_up=is_signed_up)
  return user, password


class LoginTest(TestCase):
  """ Tests the ability for a user to log in and log out """

  def setUp(self):
    self.client = Client()
    self.user, self.password = _create_user()

  def test_login(self):
    self.assertFalse(self.user.is_signed_up)
    response = self.client.post('/login/',
      {'email': self.user.email, 'password': self.password})

    user = models.User.objects.get(pk=self.user.id)
    self.assertTrue(user.is_signed_up)
    self.assertEqual(response.status_code, 302)
    self.assertTrue('welcome' in response.get('Location'))

    # Now that we are logged in, we should be able to get the page
    response = self.client.get('/welcome/')
    self.assertEqual(response.status_code, 200)

    # Logout, shouldn't be able to see the welcome page now
    response = self.client.post('/logout/', {})
    response = self.client.get('/welcome/')
    self.assertTrue('login' in response.get('Location'))

    # Try to login with an incorrect password
    response = self.client.post('/login/',
      {'email': self.user.email, 'password': self.password.upper()})
    self.assertTrue('error' in response.content)


class FeedbackTest(TestCase):
  def setUp(self):
    self.client = Client()
    self.user, self.password = _create_user()
    self.client.login(username=self.user.email, password=self.password)

  def test_feedback(self):
    feedback = 'Karthik is a joke of epic proportions.'
    self.client.post('/feedback/',
      {'feedback': feedback})

    self.assertEqual(len(mail.outbox), 1)
    self.assertEqual(mail.outbox[0].subject, 'You have feedback!')
    self.assertIn(feedback, mail.outbox[0].body)


class RosterTest(TestCase):
  def setUp(self):
    self.client = Client()

    user, self.password = _create_user('instructor')
    self.instructor = mommy.make(
      models.CourseUser,
      privilege=models.CourseUser.INSTRUCTOR,
      user=user
    )

  def test(self):
    self.client.login(username=self.instructor.user.email, password=self.password)

    # Create a new course
    response = self.client.post('/new-course/',
      {'name': 'New Course', 'term': models.Course.FALL, 'year': 2014})
    self.assertEqual(response.status_code, 302)
    self.assertIn('roster', response.get('Location'))

    response = self.client.post('/new-course/',
      {'name': '', 'term': models.Course.FALL, 'year': 2014})

    # Should fail to make a course without a name
    self.assertEqual(response.status_code, 200)
    self.assertIn('error', response.content)

    # Test adding a TA to the course
    # We add two TAs: one without an account and one with an account
    ta_user, password = _create_user('TA', True)

    response = self.client.post('/course/%d/roster/' % self.instructor.course.id,
      {
        'people': 'Firstname, Lastname, email@email.com, 0\n%s,%s, %s, %d' % (
          ta_user.first_name, ta_user.last_name, ta_user.email, 0
        ),
        'privilege': models.CourseUser.TA
      }
    )
    self.assertEqual(len(mail.outbox), 2)
    # The first user will be using the site for the first time, we should send the correct
    # email.
    self.assertIn('first time', mail.outbox[0].body)
    # The second user already has an account, so won't have that text
    self.assertNotIn('first time', mail.outbox[1].body)

    self.assertEqual(response.status_code, 302)

    ta = models.CourseUser.objects.filter(user=ta_user)
    self.assertEqual(ta.count(), 1)
    ta = ta[0]

    # Delete the TA
    response = self.client.get('/course/%d/roster/delete/%d/' % (ta.course.id, ta.id))

    # Ta shouldn't exist anymore
    ta = models.CourseUser.objects.filter(user=ta_user)
    self.assertEqual(ta.count(), 0)

    # Now let's test enrolling....
    self.client.login(username=ta_user.email, password=password)
    response = self.client.get('/enroll/%s/' % self.instructor.course.ta_enroll_token)

    ta = models.CourseUser.objects.get(user=ta_user)
    self.assertEqual(ta.privilege, models.CourseUser.TA)

    # Clicking on the student enroll token shouldn't change anything
    response = self.client.get('/enroll/%s/' % self.instructor.course.student_enroll_token)
    # Should be redirected to the roster page
    self.assertIn('roster', response.get('Location'))
    ta = models.CourseUser.objects.filter(user=ta_user)
    # Check he's still a TA
    self.assertEqual(ta[0].privilege, models.CourseUser.TA)

    # See if a student can enroll
    student_user, password = _create_user('Student', True)
    self.client.login(username=student_user.email, password=password)
    response = self.client.get('/enroll/%s/' % self.instructor.course.student_enroll_token)
    # Should see the welcome page
    self.assertIn('welcome', response.get('Location'))
    student = models.CourseUser.objects.get(user=student_user)

    self.assertEqual(student.privilege, models.CourseUser.STUDENT)

