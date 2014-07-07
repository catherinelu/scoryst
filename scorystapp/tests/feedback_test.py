from django.test import TestCase
from django.core import mail
from model_mommy import mommy
from model_mommy.recipe import Recipe, foreign_key
from scorystapp import models
from django.test.client import Client
import common


class FeedbackTest(TestCase):
  def setUp(self):
    self.client = Client()
    self.user, self.password = common.create_user()
    self.client.login(username=self.user.email, password=self.password)

  def test_feedback(self):
    feedback = 'Karthik is a joke of epic proportions.'
    self.client.post('/feedback/',
      {'feedback': feedback})

    self.assertEqual(len(mail.outbox), 1)
    self.assertEqual(mail.outbox[0].subject, 'You have feedback!')
    self.assertIn(feedback, mail.outbox[0].body)
