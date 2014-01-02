from django import shortcuts, http
from scorystapp import models, forms, decorators
from scorystapp.views import helpers, grade_or_view, send_email
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
    'is_student': False
  })


@decorators.login_required
@decorators.valid_course_user_required
def student_grade_overview(request, cur_course_user):
  """ Overview of the loggen in student's exams and grades for a particular exam. """
  cur_course = cur_course_user.course
  
  exams = models.Exam.objects.filter(course=cur_course.pk)
  return helpers.render(request, 'grade-overview.epy', {
    'title': 'Exams',
    'exams': exams,
    'course_user': cur_course_user,
    'is_student': True
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


@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_required
def release_grades(request, cur_course_user, exam_id):
  # TODO: Add released to model, so that instructor knows grades are released
  exam = shortcuts.get_object_or_404(models.Exam, pk=exam_id)
  send_email.send_exam_graded_email(request, exam)
  return shortcuts.redirect('/course/%d/grade/' % cur_course_user.course.pk)


@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def get_overview(request, cur_course_user, exam_id):
  """ Returns information about the exam, not specific to any student. """
  exam = shortcuts.get_object_or_404(models.Exam, pk=exam_id)
  exam_answers = models.ExamAnswer.objects.filter(exam=exam)

  num_graded = 0
  num_ungraded = 0

  for exam_answer in exam_answers:
    ungraded_question_answers = models.QuestionPartAnswer.objects.filter(
      exam_answer=exam_answer, graded=False).count()
    if ungraded_question_answers > 0:
      num_ungraded += 1
    else:
      num_graded += 1

  to_return = {
    'numGraded': num_graded,
    'numUngraded': num_ungraded,
  }

  if num_graded + num_ungraded > 0:
    percentage_graded = int(float(num_graded) / float(num_graded + num_ungraded) * 100)
    percentage_ungraded = int(float(num_ungraded) / float(num_graded + num_ungraded) * 100)
    to_return.update({ 'percentageGraded': percentage_graded,
      'percentageUngraded': percentage_ungraded })

  return http.HttpResponse(json.dumps(to_return), mimetype='application/json')