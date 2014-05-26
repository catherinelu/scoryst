from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.core.files import File
from scorystapp import models
import json
import os
import random


class Command(BaseCommand):
  help = 'Initializes the database for demoing purposes'

  def handle(self, *args, **options):
    os.system('python manage.py reset_db --noinput')
    os.system('python manage.py syncdb --noinput')

    superuser_data = json.load(open('scorystapp/fixtures/development/superuser.json'))
    get_user_model().objects.create_superuser(superuser_data['email'],
      superuser_data['first_name'], superuser_data['last_name'],
      superuser_data['id'], superuser_data['password'])

    rubrics_data = json.load(open('scorystapp/fixtures/development/rubrics.json'))

    course = models.Course(name='CS144', term=0)
    course.save()

    # Make the superuser the Instructor for this course
    user = models.User.objects.get(pk=1)
    course_user = models.CourseUser(user=user, course=course, privilege=2)
    course_user.save()

    users = []
    course_users = []
    num_rubrics = 5

    user_first_names = sorted(['John', 'Cynthia', 'Albert', 'Arushi', 'Chenyuan',
      'Jose', 'Brett', 'Crystal', 'Jenny', 'Andy',
      'Benjamin', 'George', 'Sheila', 'Stephanie', 'Kunal',
      'Alp', 'Keith', 'Daryl', 'Neeraj', 'Eileen',
      'Ahmed', 'Keegan', 'Adam', 'Reid', 'Sarah'])

    user_last_names = ['Holmstead', 'Boyle', 'Wu', 'Goel', 'Wong',
      'Garcia', 'White', 'Whittaker', 'Hong', 'Moeur',
      'Turk', 'Wyngar', 'Wong', 'Seth', 'Nguyen',
      'Bourabee', 'Go', 'Jensen', 'Johnson', 'Lockheart']

    for i in range(len(user_last_names)):
      email = 'fake_email' + str(i) + '@gmail.com'
      user2 = models.User(email=email, first_name=user_first_names[i],
        last_name=user_last_names[i], student_id='0' + str(5715000 + random.randint(1001,9999)), is_signed_up=True)
      user2.save()
      course_user2 = models.CourseUser(user=user2, course=course, privilege=0)
      course_user2.save()
      users.append(user2)
      course_users.append(course_user2)

    num_pages = 8
    pdf = open('scorystapp/fixtures/demo/kv.pdf', 'r')
    exam = models.Exam(name='Midterm Exam', course=course, page_count=num_pages)
    exam.exam_pdf.save('new', File(pdf))
    solutions_pdf = open('scorystapp/fixtures/demo/solutions.pdf', 'r')
    exam.solutions_pdf.save('new', File(solutions_pdf))
    exam.save()

    for i in range(num_pages):
      f = open('scorystapp/fixtures/demo/kv' + str(i) + '.jpeg', 'r')
      exam_page = models.ExamPage(exam=exam, page_number=i+1)
      exam_page.page_jpeg.save('new', File(f))
      exam_page.save()
      f.close()

    question_parts = []

    # i is for questions, j is for parts
    # Requires: i*j = num_pages
    for i in range(num_pages/2):
      for j in range(2):
        question_part = models.QuestionPart(exam=exam, question_number=i+1, part_number=j+1, max_points=10,
          pages= 2*i + j + 1)
        question_part.save()
        question_parts.append(question_part)

        rubric = models.Rubric(question_part=question_part, description='Correct answer', points=0)
        rubric.save()

        rubric2 = models.Rubric(question_part=question_part, description='Incorrect answer', points=10)
        rubric2.save()

        random.shuffle(rubrics_data)

        for k in range(num_rubrics - 2):
          rubric3 = models.Rubric(question_part=question_part,
            description=rubrics_data[k]['description'], points=rubrics_data[k]['points'])
          rubric3.save()

    course_user_a = course_users[0]
    course_user_b = course_users[1]

    # Exam for first course user - uses karanveer's exam
    pdf = open('scorystapp/fixtures/demo/kv.pdf', 'r')
    exam_answer = models.ExamAnswer(exam=exam, course_user=course_user_a, page_count=num_pages)
    exam_answer.pdf.save('new', File(pdf))
    exam_answer.save()
    pdf.close()

    for i in range(num_pages):
      f = open('scorystapp/fixtures/demo/kv' + str(i) + '.jpeg', 'r')
      exam_answer_page = models.ExamAnswerPage(exam_answer=exam_answer, page_number=i+1)
      exam_answer_page.page_jpeg.save('new', File(f))
      exam_answer_page.save()
      f.close()

    for i in range(num_pages):
      response = models.Response(exam_answer=exam_answer, question_part=question_parts[i], pages=i+1)
      response.save()

    # Exam for second course user - uses squishy's exam
    pdf = open('scorystapp/fixtures/demo/cglu.pdf', 'r')
    exam_answer = models.ExamAnswer(exam=exam, course_user=course_user_b, page_count=num_pages)
    exam_answer.pdf.save('new', File(pdf))
    exam_answer.save()
    pdf.close()

    for i in range(num_pages):
      f = open('scorystapp/fixtures/demo/cglu' + str(i) + '.jpeg', 'r')
      exam_answer_page = models.ExamAnswerPage(exam_answer=exam_answer, page_number=i+1)
      exam_answer_page.page_jpeg.save('new', File(f))
      exam_answer_page.save()
      f.close()

    for i in range(num_pages):
      response = models.Response(exam_answer=exam_answer, question_part=question_parts[i], pages=i+1)
      response.save()

    self.stdout.write('Successfully initialized database')


    # Create another exam that has no students mapped so can be editted
    num_pages = 5
    exam = models.Exam(name='Final Exam', course=course, page_count=num_pages)
    pdf = open('scorystapp/fixtures/demo/cs221.pdf', 'r')
    exam.exam_pdf.save('new', File(pdf))
    exam.save()

    for i in range(num_pages):
      f = open('scorystapp/fixtures/demo/cs221' + str(i) + '.jpeg', 'r')
      exam_page = models.ExamPage(exam=exam, page_number=i+1)
      exam_page.page_jpeg.save('new', File(f))
      exam_page.save()
      f.close()

    question_parts = []

    # i is for questions, j is for parts
    # Requires: i*j = num_pages
    for i in range(2):
      for j in range(2):
        question_part = models.QuestionPart(exam=exam, question_number=i+1, part_number=j+1, max_points=10,
          pages= 2*i + j + 2)
        question_part.save()

        rubric = models.Rubric(question_part=question_part, description='Correct answer', points=0)
        rubric.save()

        rubric2 = models.Rubric(question_part=question_part, description='Incorrect answer', points=10)
        rubric2.save()

        random.shuffle(rubrics_data)

        for k in range(num_rubrics - 2):
          rubric3 = models.Rubric(question_part=question_part,
            description=rubrics_data[k]['description'], points=rubrics_data[k]['points'])
          rubric3.save()
