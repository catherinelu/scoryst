from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, \
  BaseUserManager
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
  """ Manages the creation of user accounts. """

  def create_user(self, email, first_name, last_name, student_id, password=None,
        **extra_fields):
    """ Creates and saves a user with the given fields. """
    now = timezone.now()
    if not email:
        raise ValueError('The given email must be set.')

    email = UserManager.normalize_email(email)
    user = self.model(email=email, first_name=first_name, last_name=last_name,
                      student_id=student_id, is_staff=False, is_active=True,
                      is_superuser=False, last_login=now, date_joined=now,
                      **extra_fields)

    user.set_password(password)
    user.save(using=self._db)
    return user

  def create_superuser(self, email, first_name, last_name, student_id,
        password, **extra_fields):
    """ Creates and saves a superuser with the given fields. """
    user = self.create_user(email, first_name, last_name, student_id, password,
      **extra_fields)

    user.is_staff = True
    user.is_active = True
    user.is_superuser = True
    user.is_signed_up = True

    user.save(using=self._db)
    return user


# TODO: add db indexes?
class User(AbstractBaseUser, PermissionsMixin):
  """ Represents a user identified by an email/password combination. """

  # personal information
  email = models.EmailField(max_length=100, unique=True)
  first_name = models.CharField(max_length=30)
  last_name = models.CharField(max_length=30)

  # permissions
  is_staff = models.BooleanField(default=False,
      help_text='Designates whether the user can log into this admin site.')
  is_active = models.BooleanField(default=True,
      help_text='Designates whether this user should be treated as '
                'active. Unselect this instead of deleting accounts.')

  # student information
  # TODO: char or integer? enforce in form
  student_id = models.CharField(max_length=100)
  is_signed_up = models.BooleanField(default=False)

  date_joined = models.DateTimeField(default=timezone.now)
  objects = UserManager()

  USERNAME_FIELD = 'email'
  REQUIRED_FIELDS = ['first_name', 'last_name', 'student_id']

  def get_full_name(self):
    """ Returns the full name (first + ' ' + last) of this user. """
    full_name = '%s %s' % (self.first_name, self.last_name)
    return full_name.strip()

  def get_short_name(self):
    """ Returns the first name of this user. Required for Django admin. """
    return self.first_name


class Course(models.Model):
  """ Represents a particular course. Many users can be in a course. """
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
  year = models.IntegerField(default=timezone.now().year)


class CourseUser(models.Model):
  """ Represents a course that a user is in. """
  # Enums for the privilege field
  STUDENT = 0
  TA = 1
  INSTRUCTOR = 2
  USER_PRIVILEGE_CHOICES = (
    (STUDENT, 'Student'),
    (TA, 'TA'),
    (INSTRUCTOR, 'Instructor')
  )

  # The actual model fields
  user = models.ForeignKey(User)
  course = models.ForeignKey(Course)
  privilege = models.IntegerField(choices=USER_PRIVILEGE_CHOICES, default=STUDENT)


class Exam(models.Model):
  """ Represents a particular exam associated with a course. """
  course = models.ForeignKey(Course)
  name = models.CharField(max_length=200)
  empty_file_path = models.TextField(blank=True)
  sample_answer_path = models.TextField(blank=True)


class Question(models.Model):
  """ Represents a particular question/part associated with an exam. """
  exam = models.ForeignKey(Exam)
  question_number = models.IntegerField()         # Question number on the exam
  part_number = models.IntegerField(null=True)    # Question part on the exam.
  max_points = models.FloatField()
  pages = models.CommaSeparatedIntegerField(max_length=200)


class Rubric(models.Model):
  """ Represents a grading criterion associated with a question. """
  question = models.ForeignKey(Question)
  description = models.CharField(max_length=200)
  points = models.FloatField()


###############################################################################
# The following models represent a student's answered exam.
###############################################################################

class ExamAnswer(models.Model):
  """ Represents a student's exam. """
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

  exam = models.ForeignKey(Exam)
  course_user = models.ForeignKey(CourseUser,null=True)
  exam_path = models.TextField()
  exam_type = models.IntegerField(choices=FILE_TYPE)


class QuestionAnswer(models.Model):
  """ Represents a student's answer to a question/part. """
  exam_answer = models.ForeignKey(ExamAnswer)
  question = models.ForeignKey(Question)
  pages = models.CommaSeparatedIntegerField(max_length=200)

  graded = models.BooleanField(default=False)
  grader_comments = models.TextField(blank=True)
  grader = models.ForeignKey(CourseUser, null=True)


class GradedRubric(models.Model):
  """ Represents a rubric that was chosen by a TA. """
  question_answer = models.ForeignKey(QuestionAnswer)
  question = models.ForeignKey(Question)

  # One of rubric and custom_points must be null
  rubric = models.ForeignKey(Rubric, null=True)
  custom_points = models.FloatField(null=True)

  def clean(self):
    # Either rubric id or custom points must be filled in
    if self.rubric.id == null and self.custom_points == null:
      raise ValidationError('Either rubric ID or custom points must be set')


# TODO: always extend object class
# TODO; docs
class AmazonS3():
  # TODO: For testing, we are using 
  # cors_cfg.add_rule('GET', '*') allowing CORS from all origins
  # When we have our own domain, switch it accordingly:
  # http://boto.readthedocs.org/en/latest/s3_tut.html#setting-getting-deleting-cors-configuration-on-a-bucket
  from boto.s3.connection import S3Connection
  conn = S3Connection('AKIAICBWMVSQDNC6D3IA', 'CloOuyxxjOfVVW4Th7PCszeduBMf66Lr8/HnLG3U')
  bucket = conn.get_bucket('classlumo_private_bucket')
