from django.test import TestCase
from django.core import mail
from model_mommy import mommy
from model_mommy.recipe import Recipe, foreign_key
from scorystapp import models
from django.test.client import Client
import common

class LoginTest(TestCase):
  """ Tests the ability for a user to log in and log out """

  def setUp(self):
    self.client = Client()
    self.user, self.password = common.create_user()

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

