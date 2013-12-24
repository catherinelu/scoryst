from django.core.management.base import BaseCommand, CommandError
from django.core.files import File
from classallyapp import models

class Command(BaseCommand):
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
    for i in range(2):
      user2 = models.User(email='studentemail' + str(i) +'@gmail.com', first_name='Student', last_name=str(i), student_id=i+1)
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

    questions = []

    # i is for questions, j is for parts
    # Requires: i*j = NUM_PAGES
    for i in range(2):
      for j in range(2):
        question = models.Question(exam=exam, question_number=i+1, part_number=j+1, max_points=10, 
          pages= 2*i + j + 1)
        question.save()  
        questions.append(question)
        
        rubric = models.Rubric(question=question, description='All correct', points=0)
        rubric.save()
     
        rubric2 = models.Rubric(question=question, description='No explanation', points=-2)
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
        question_answer = models.QuestionAnswer(exam_answer=exam_answer, question=questions[i], pages=i+1)
        question_answer.save()

      graded_rubric = models.GradedRubric(question_answer=question_answer,
        question=questions[NUM_PAGES-1], rubric=rubric)
      graded_rubric.save()
    self.stdout.write('Successfully initialized database')