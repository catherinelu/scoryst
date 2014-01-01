from django import shortcuts, http
from scorystapp import models, decorators
from scorystapp.views import helpers
import json

@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def map(request, cur_course_user, exam_id):
  """ Renders the map exams page """
  return helpers.render(request, 'map-exams.epy', {'title': 'Map Exams'})


@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def get_all_course_students(request, cur_course_user, exam_id):
  """
  Returns a json representation of a list where each element has the name, email,
  student_id, course_user id of the student along with 'tokens' which is needed by typeahead.js
  """
  exam = shortcuts.get_object_or_404(models.Exam, pk=exam_id)
  students = models.CourseUser.objects.filter(course=cur_course_user.course,
    privilege=models.CourseUser.STUDENT)

  students_to_return = []
  for student in students:
    student_to_return = {
      'name': student.user.get_full_name(),
      'email': student.user.email,
      'studentId': student.user.student_id,
      'courseUserId': student.id,
      'tokens': [student.user.first_name, student.user.last_name]
    }

    # Check if the student has already been mapped or not
    try:
      exam_answer = models.ExamAnswer.objects.get(course_user=student,exam=exam)
      student_to_return['mapped'] = True
    except:
      student_to_return['mapped'] = False

    students_to_return.append(student_to_return)

  return http.HttpResponse(json.dumps(students_to_return), mimetype='application/json')


@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def get_all_unmapped_exams(request, cur_course_user, exam_id):
  """
  Returns a list where each element is a dict of exam_answer_id and url to the jpeg image of the 
  first page of the unmapped exam
  """
  unmapped_exam_answers = models.ExamAnswer.objects.filter(exam_id=exam_id, course_user__isnull=True,
    preview=False)
  unmapped_exam_answers_list = []
  
  for unmapped_exam_answer in unmapped_exam_answers:
    exam_answer_page = models.ExamAnswerPage.objects.get(exam_answer=unmapped_exam_answer,
      page_number=1)
    unmapped_exam_answers_list.append({
      'examAnswerId': unmapped_exam_answer.id,
      'url': exam_answer_page.page_jpeg.url
    })

  return http.HttpResponse(json.dumps(unmapped_exam_answers_list), mimetype='application/json')


@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def map_exam_to_student(request, cur_course_user, exam_id, exam_answer_id, course_user_id):
  """
  Maps the exam_answer corresponding to exam_answer_id to the course user corresponding to
  course_user_id
  """
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  course_user = shortcuts.get_object_or_404(models.CourseUser, pk=course_user_id)
  exam_answer.course_user = course_user
  exam_answer.save()
  return http.HttpResponse('', content_type='text/plain')
