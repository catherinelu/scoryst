from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models
from django.db import ModelForm
from datetime import datetime

# Enums for the type field
JPG = 0
PNG = 1
PDF = 2
TEXT = 3
FILE_TYPE = (
	(JPG, 'jpg'),
	(PNG, 'png'),
	(PDF, 'pdf'),
	(TEXT, 'text')
)

class User(models.Model):
	user = models.OneToOneField(User)
	# College id is the college id as an int e.g. 01234567
	college_id = models.IntegerField()
	college_username = models.CharField(max_length=200)
	signed_up = models.BooleanField(default=False)

class ClassUser(models.Model):
	"""Represents a class that a user is in. By default, the user is a student."""
	
	# Enums for the privilege field
	STUDENT = 0
	TA = 1
	SUPER_TA = 2
	USER_PRIVILEGE_CHOICES = (
		(STUDENT, 'Student'),
		(TA, 'TA'),
		(SUPER_TA, 'Super TA')
	)

	# The actual model fields
	user_id = models.IntegerField()
	class_id = models.IntegerField()
	privilege = models.IntegerField(choices=USER_PRIVILEGE_CHOICES, default=STUDENT)

class Class(models.Model):
	"""Represents a particular class. Many classusers can be in a class."""

	# Enums for the term field
	FALL = 0
	WINTER = 1
	SPRING = 2
	SUMMER = 3
	TERM_CHOICES = (
		(FALL, 'Fall'),
		(WINTER, 'Winter'),
		(SPRING, 'Spring'),
		(SUMMER, 'Summer')
	)

	name = models.CharField(max_length=200)
	term = models.IntegerField(choices=TERM_CHOICES)
	year = models.IntegerField(default=datetime.now().year)


###############################################################################
# The following models represent a test that is not associated with a
# particular student.
###############################################################################

class Test(models.Model):
	"""Represents a particular test. Associated with a class."""

	class_id = models.IntegerField()
	test_name = models.CharField(max_length=200)
	sample_answer_path = models.TextField()
	sample_answer_type = models.IntegerField(choices=FILE_TYPE, default=PDF)

class Question(models.Model):
	"""Represents a particular question / part of question. Associated with a test."""

	test_id = models.IntegerField()
	number = models.IntegerField()           # Question number on the test
	part = models.IntegerField(null=True)    # Question part on the test.
	max_points = models.FloatField()

class Rubric(models.Model):
	"""Associated with a question."""

	question_id = models.IntegerField()
	description = models.CharField(max_length=200)
	points = models.FloatField()


###############################################################################
# The following models represent a student's answered test.
###############################################################################

class TestAnswer(models.Model):
	"""Represents a student's test. """

	test_id = models.IntegerField()
	classuser_id = models.IntegerField()
	test_path = models.TextField()
	test_type = models.IntegerField(choices=FILE_TYPE)

class QuestionAnswer(models.Model):
	"""Represents a student's answer to a question / part."""
	
	testanswer_id = models.IntegerField()
	question_id = models.IntegerField()
	pages = models.CommaSeparatedIntegerField(max_length=200)
	graded = models.BooleanField(default=False)
	grader_comments = models.TextField()

class GradedRubric(models.Model):
	"""Represents a rubric that was chosen by a TA."""

	questionanswer_id = models.IntegerField()
	rubric_id = models.IntegerField(null=True)
	custom_points = models.FloatField(null=True)

	def clean(self):
		# Either rubric id or custom points must be filled in
		if self.rubric_id == null and self.custom_points == null:
			raise ValidationError('Either rubric ID or custom points must be set')


###############################################################################
# The following are forms we create based on some of the models
###############################################################################

