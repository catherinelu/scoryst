from django.core.management.base import BaseCommand, CommandError
from django.core.files import File
from classallyapp import models

class Command(BaseCommand):
  # TODO: Allow args
  args = 'None'
  help = 'Initializes the database for testing purposes'

  def handle(self, *args, **options):
    course = models.Course(name='Test Course', term=0)
    course.save()
     
    user = models.User.objects.get(pk=1)
    course_user = models.CourseUser(user=user, course=course, privilege=2)
    course_user.save()

    users = []
    course_users = []
    NUM_PAGES = 4
    emails = ['livetoeat11@gmail.com', 'add_your_test_email@gmail.com']
    for i in range(2):
      user2 = models.User(email=emails[i], first_name='Student',
        last_name=str(i), student_id=i+1, is_signed_up=True)
      user2.save()
      course_user2 = models.CourseUser(user=user2, course=course, privilege=0)
      course_user2.save()
      users.append(user2)
      course_users.append(course_user2)

    pdf = open('classallyapp/static/development/exam.pdf')
    exam = models.Exam(name='Test Exam', course=course, page_count=NUM_PAGES)
    exam.exam_pdf.save('new', File(pdf))
    exam.save()

    for i in range(NUM_PAGES):
      f = open('classallyapp/static/development/img' + str(i) + '.jpeg')
      exam_page = models.ExamPage(exam=exam, page_number=i+1)
      exam_page.page_jpeg.save('new', File(f))
      exam_page.save()
      f.close()

    question_parts = []

    # i is for questions, j is for parts
    # Requires: i*j = NUM_PAGES
    for i in range(2):
      for j in range(2):
        question_part = models.QuestionPart(exam=exam, question_number=i+1, part_number=j+1, max_points=10, 
          pages= 2*i + j + 1)
        question_part.save()  
        question_parts.append(question_part)
        
        rubric = models.Rubric(question_part=question_part, description='All correct', points=0)
        rubric.save()
     
        rubric2 = models.Rubric(question_part=question_part, description='No explanation', points=-2)
        rubric2.save()


    for c in course_users:
      exam_answer = models.ExamAnswer(exam=exam, course_user=c, page_count=NUM_PAGES)
      exam_answer.pdf.save('new', File(pdf))
      exam_answer.save()

      for i in range(NUM_PAGES):
        f = open('classallyapp/static/development/img' + str(i) + '.jpeg')
        exam_answer_page = models.ExamAnswerPage(exam_answer=exam_answer, page_number=i+1)
        exam_answer_page.page_jpeg.save('new', File(f))
        exam_answer_page.save()
        f.close()

      for i in range(NUM_PAGES):
        question_part_answer = models.QuestionPartAnswer(exam_answer=exam_answer, question_part=question_parts[i], pages=i+1)
        question_part_answer.save()

      graded_rubric = models.GradedRubric(question_part_answer=question_part_answer,
        question_part=question_parts[NUM_PAGES-1], rubric=rubric)
      graded_rubric.save()
    self.stdout.write('Successfully initialized database')