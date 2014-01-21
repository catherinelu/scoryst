from django.core.management.base import BaseCommand, CommandError
from django.core.files import File
from scorystapp import models
from optparse import make_option
import json
import random
import threading

def make_option_list():
  option_list = BaseCommand.option_list + (
    make_option(
      "-n", 
      "--numstudents", 
      help = "specify number of students in course", 
      type = "int"
    ),
  )

  option_list = option_list + (
    make_option(
      "-p", 
      "--numpages", 
      help = "specify number of pages in course. MUST be even.", 
      type = "int"
    ),
  )

  option_list = option_list + (
    make_option(
      "-r", 
      "--numrubrics", 
      help = "specify number of rubrics associated with a question_part", 
      type = "int"
    ),
  )

  option_list = option_list + (
    make_option(
      "-s", 
      "--studentemail", 
      help = "specify email id of one student, for testing purposes", 
    ),
  )

  option_list = option_list + (
    make_option(
      "-m",
      "--map",
      action="store_true",
      help="Add this flag if test cases need for mapping",
    ),
  )
  return option_list

class Command(BaseCommand):
  help = 'Initializes the database for testing purposes'
  option_list = make_option_list()

  def handle(self, *args, **options):
    num_students = 2
    num_pages = 4
    num_rubrics = 2
    student_email = 'livetoeat11@gmail.com'
    rubrics_data = json.load(open('scorystapp/static/development/rubrics.json'))
    
    # Get args, if any
    if options['numstudents']:
      num_students = options['numstudents'] if options['numstudents'] > 0 else num_students

    if options['numpages']:
      num_pages = options['numpages'] if options['numpages'] > 0 else num_pages

    # Ensure number of pages is even
    if num_pages % 2 == 1:
      num_pages += 1

    if options['numrubrics']:
      num_rubrics = options['numrubrics'] if options['numrubrics'] > 2 else num_rubrics
      if num_rubrics > len(rubrics_data) + 2:
        num_rubrics = len(rubrics_data) + 2

    if options['studentemail']:
      student_email = options['studentemail']

    course = models.Course(name='Test Course', term=0)
    course.save()
     
    user = models.User.objects.get(pk=1)
    course_user = models.CourseUser(user=user, course=course, privilege=2)
    course_user.save()

    users = []
    course_users = []
    
    for i in range(num_students):
      if i == 0:
        email = student_email
      else:
        # Use some fake email
        email = 'fake_email' + str(i) + '@gmail.com'
      user2 = models.User(email=email, first_name='Student',
        last_name=str(i), student_id=i+1, is_signed_up=True)

      user2.save()
      course_user2 = models.CourseUser(user=user2, course=course, privilege=0)
      course_user2.save()
      users.append(user2)
      course_users.append(course_user2)

    pdf = open('scorystapp/static/development/exam.pdf', 'r')
    exam = models.Exam(name='Test Exam', course=course, page_count=num_pages)
    exam.exam_pdf.save('new', File(pdf))
    exam.save()

    for i in range(num_pages):
      f = open('scorystapp/static/development/img' + str(i) + '.jpeg', 'r')
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
    
    # Multithread the shit out of this bitch.
    def create_course_user_exam_answer(c, exam, num_pages, question_parts, rubric, course_user):
      pdf = open('scorystapp/static/development/exam.pdf', 'r')
      exam_answer = models.ExamAnswer(exam=exam, course_user=c, page_count=num_pages)
      exam_answer.pdf.save('new', File(pdf))
      exam_answer.save()
      pdf.close()

      for i in range(num_pages):
        f = open('scorystapp/static/development/img' + str(i) + '.jpeg', 'r')
        exam_answer_page = models.ExamAnswerPage(exam_answer=exam_answer, page_number=i+1)
        exam_answer_page.page_jpeg.save('new', File(f))
        exam_answer_page.save()
        f.close()

      for i in range(num_pages):
        question_part_answer = models.QuestionPartAnswer(exam_answer=exam_answer, question_part=question_parts[i], pages=i+1)
        question_part_answer.save()

      question_part_answer.grader = course_user
      question_part_answer.rubrics.add(rubric)
      question_part_answer.save()

    for c in course_users:
      t = threading.Thread(target=create_course_user_exam_answer,
        args=(c, exam, num_pages, question_parts, rubric, course_user)).start()
      
    self.stdout.write('Successfully initialized database')
    
    # TODO: rewrite
    if not options['map']:
      return
    self.stdout.write('Beginning mapping code')

    pdf = open('scorystapp/static/development/exam.pdf', 'r')
    exam = models.Exam(name='Map Exams', course=course, page_count=num_pages)
    exam.exam_pdf.save('new', File(pdf))
    exam.save()

    for i in range(num_pages):
      f = open('scorystapp/static/development/img' + str(i) + '.jpeg', 'r')
      exam_page = models.ExamPage(exam=exam, page_number=i+1)
      exam_page.page_jpeg.save('new', File(f))
      exam_page.save()
      f.close()

    def create_unmapped_exam(exam, num_pages):
      pdf = open('scorystapp/static/development/exam.pdf', 'r')
      exam_answer = models.ExamAnswer(exam=exam, page_count=num_pages)
      exam_answer.pdf.save('new', File(pdf))
      exam_answer.save()
      pdf.close()

      for i in range(num_pages):
        f = open('scorystapp/static/development/img' + str(random.randint(0, 12)) + '.jpeg', 'r')
        exam_answer_page = models.ExamAnswerPage(exam_answer=exam_answer, page_number=i+1)
        exam_answer_page.page_jpeg.save('new', File(f))
        exam_answer_page.save()
        f.close()

    for _ in range(num_students):
      t = threading.Thread(target=create_unmapped_exam,
        args=(exam, num_pages)).start()

    self.stdout.write('Mapping db done')
