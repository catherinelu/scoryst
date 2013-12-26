from django import shortcuts, http
from classallyapp import models, forms, decorators
from classallyapp.views import helpers, grade_or_view
import json


@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def grade_overview(request, cur_course_user):
  """ Overview of all of the students' exams and grades for a particular exam. """
  cur_course = cur_course_user.course
  
  exams = models.Exam.objects.filter(course=cur_course.pk)
  student_course_users = models.CourseUser.objects.filter(course=cur_course.pk,
    privilege=models.CourseUser.STUDENT)
  student_users = map(lambda course_user: course_user.user, student_course_users)

  return helpers.render(request, 'grade-overview.epy', {
    'title': 'Exams',
    'exams': exams,
    'student_users': student_users,
  })


@decorators.login_required
@decorators.course_required
def student_grade_overview(request, cur_course_user):
  """ Overview of the loggen in student's exams and grades for a particular exam. """
  cur_course = cur_course_user.course
  
  exams = models.Exam.objects.filter(course=cur_course.pk)
  return helpers.render(request, 'student-grade-overview.epy', {
    'title': 'Exams',
    'exams': exams,
    'course_user': cur_course_user,
  })  


@decorators.login_required
@decorators.valid_course_user_required
def get_user_exam_summary(request, cur_course_user, user_id, exam_id):
  """ Returns an exam summary given the user's ID and the course. """
  if (cur_course_user.user.pk != int(user_id)):
    return _get_user_exam_summary_instructor(request, cur_course_user, user_id, exam_id)
  else:
    return _get_user_exam_summary_student(request, cur_course_user, user_id, exam_id)


def _get_user_exam_summary_student(request, cur_course_user, user_id, exam_id):
  """ Returns an exam summary given the user's ID and the course. """
  try:
    exam_answer = models.ExamAnswer.objects.get(exam=exam_id, course_user__user=user_id)
  except models.ExamAnswer.DoesNotExist:
    return http.HttpResponse(json.dumps({'noMappedExam': True}),
      mimetype='application/json')
  exam_summary = grade_or_view.get_summary_for_exam(exam_answer.id)
  return http.HttpResponse(json.dumps(exam_summary), mimetype='application/json')


@decorators.instructor_or_ta_required
def _get_user_exam_summary_instructor(request, cur_course_user, user_id, exam_id):
  """ Returns an exam summary given the user's ID and the course. """
  try:
    exam_answer = models.ExamAnswer.objects.get(exam=exam_id, course_user__user=user_id)
  except models.ExamAnswer.DoesNotExist:
    return http.HttpResponse(json.dumps({'noMappedExam': True}),
      mimetype='application/json')

  exam_summary = grade_or_view.get_summary_for_exam(exam_answer.id)
  return http.HttpResponse(json.dumps(exam_summary), mimetype='application/json')
