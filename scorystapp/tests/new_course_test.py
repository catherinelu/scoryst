from django.test import TestCase
from django.core import mail
from model_mommy import mommy
from model_mommy.recipe import Recipe, foreign_key
from scorystapp import models
from django.test.client import Client
import common

class NewCourseTest(TestCase):
  def setUp(self):
    self.client = Client()

    user, self.password = common.create_user('instructor')
    self.instructor = mommy.make(
      models.CourseUser,
      privilege=models.CourseUser.INSTRUCTOR,
      user=user
    )
    self.client.login(username=self.instructor.user.email, password=self.password)

  def test_new_course_creation(self):
    # Create a new course
    response = self.client.post('/new-course/',
      {'name': 'New Course', 'term': models.Course.FALL, 'year': 2014})
    self.assertEqual(response.status_code, 302)
    self.assertIn('roster', response.get('Location'))

    # Should fail to make a course without a name
    response = self.client.post('/new-course/',
      {'name': '', 'term': models.Course.FALL, 'year': 2014})
    self.assertEqual(response.status_code, 200)
    self.assertIn('error', response.content)

    # Should fail to make a course with an incorrect term
    response = self.client.post('/new-course/',
      {'name': '', 'term': 5, 'year': 2014})
    self.assertEqual(response.status_code, 200)
    self.assertIn('error', response.content)

    # Should fail to make a course without an integer year
    response = self.client.post('/new-course/',
      {'name': '', 'term': 5, 'year': 'hi'})
    self.assertEqual(response.status_code, 200)
    self.assertIn('error', response.content)
