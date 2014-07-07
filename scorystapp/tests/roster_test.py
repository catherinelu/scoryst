from django.test import TestCase
from django.core import mail
from model_mommy import mommy
from model_mommy.recipe import Recipe, foreign_key
from scorystapp import models
from django.test.client import Client
import common


class RosterTest(TestCase):
  def setUp(self):
    self.client = Client()

    user, self.password = common.create_user('instructor')
    self.instructor = mommy.make(
      models.CourseUser,
      privilege=models.CourseUser.INSTRUCTOR,
      user=user
    )
    self.client.login(username=self.instructor.user.email, password=self.password)

  def test_roster_add_ta(self):
    # Test adding a TA to the course
    # We add two TAs: one without an account and one with an account
    ta_user, password = common.create_user('TA', True)

    response = self.client.post('/course/%d/roster/' % self.instructor.course.id,
      {
        'people': 'Firstname, Lastname, email@email.com, 0\n%s,%s, %s, %d' % (
          ta_user.first_name, ta_user.last_name, ta_user.email, 0
        ),
        'privilege': models.CourseUser.TA
      }
    )
    self.assertEqual(len(mail.outbox), 2)
    # The first user will be using the site for the first time
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

  def test_roster_add_student(self):
    student_user, password = common.create_user('Student')

    response = self.client.post('/course/%d/roster/' % self.instructor.course.id,
      {
        'people': 'Firstname, Lastname, email@email.com, 0\n%s,%s, %s, %d' % (
          student_user.first_name, student_user.last_name, student_user.email, 0
        ),
        'privilege': models.CourseUser.STUDENT
      }
    )
    # No emails sent for students
    self.assertEqual(len(mail.outbox), 0)

    # Will fail if student doesn't exist
    student = models.CourseUser.objects.get(user=student_user,
      privilege=models.CourseUser.STUDENT)

    # Delete the student
    response = self.client.get('/course/%d/roster/delete/%d/' % (student.course.id, student.id))

    # student shouldn't exist anymore
    student = models.CourseUser.objects.filter(user=student_user)
    self.assertEqual(student.count(), 0)

  def test_roster_student_privileges(self):
    # The student should not be able to view/edit anything to do with the roster
    user, password = common.create_user('student')
    student = mommy.make(
      models.CourseUser,
      privilege=models.CourseUser.STUDENT,
      user=user
    )
    self.client.login(username=student.user.email, password=password)

    # Try to visit the roster page
    response = self.client.get('/course/%d/roster/' % student.course.id)
    self.assertEqual(response.status_code, 404)

    # Try to add someone from the roster
    response = self.client.post('/course/%d/roster/' % student.course.id,
      {
        'people': 'Firstname, Lastname, email@email.com, 0',
        'privilege': models.CourseUser.STUDENT
      }
    )
    self.assertEqual(response.status_code, 404)

    # Try deleting
    response = self.client.get('/course/%d/roster/delete/%d/' % (student.course.id, student.id))
    self.assertEqual(response.status_code, 404)

  def test_student_enrollment(self):
    course = self.instructor.course

    student_user, password = common.create_user('Student', True)
    self.client.login(username=student_user.email, password=password)

    response = self.client.get('/enroll/%s/' % course.student_enroll_token)
    # Should see the welcome page
    self.assertIn('welcome', response.get('Location'))

    # Make sure the student is enrolled now
    student = models.CourseUser.objects.get(user=student_user, privilege=models.CourseUser.STUDENT)

    # Visiting the enroll link again should make no difference
    response = self.client.get('/enroll/%s/' % course.student_enroll_token)
    self.assertIn('welcome', response.get('Location'))

  def test_ta_enrollment(self):
    course = self.instructor.course

    ta_user, password = common.create_user('TA', True)
    self.client.login(username=ta_user.email, password=password)

    response = self.client.get('/enroll/%s/' % course.ta_enroll_token)
    # Should see the roster page
    self.assertIn('roster', response.get('Location'))

    # Make sure the TA is enrolled now
    ta = models.CourseUser.objects.get(user=ta_user, privilege=models.CourseUser.TA)

    # Visiting the student enroll link should make no difference
    response = self.client.get('/enroll/%s/' % course.student_enroll_token)
    self.assertIn('roster', response.get('Location'))
    # Should still have TA status
    ta = models.CourseUser.objects.get(user=ta_user, privilege=models.CourseUser.TA)

    # Delete TA
    ta.delete()
    # Enroll as student first
    response = self.client.get('/enroll/%s/' % course.student_enroll_token)
    self.assertIn('welcome', response.get('Location'))
    # Has student status
    models.CourseUser.objects.get(user=ta_user, privilege=models.CourseUser.STUDENT)

    # Upgrade to TA
    response = self.client.get('/enroll/%s/' % course.ta_enroll_token)
    models.CourseUser.objects.get(user=ta_user, privilege=models.CourseUser.TA)
