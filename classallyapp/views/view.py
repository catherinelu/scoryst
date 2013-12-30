from django import shortcuts
from classallyapp import models, decorators
from classallyapp.views import helpers


@decorators.login_required
@decorators.valid_course_user_required
@decorators.student_required
def view_exam(request, cur_course_user, exam_answer_id):
  """
  Intended as the URL for students who are viewing their exam. Renders the same
  grade template.
  """
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)

  return helpers.render(request, 'grade.epy', {
    'title': 'View Exam',
    'course': cur_course_user.course.name,
    'studentName': exam_answer.course_user.user.get_full_name(),
    'isStudentView' : True,
    'solutionsExist': bool(exam_answer.exam.solutions_pdf.name)
  })


@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def preview_exam(request, cur_course_user, exam_answer_id):
  """
  Intended as the URL for TAs who are previewing the exams they created. 
  Renders the same grade template.
  """
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)

  return helpers.render(request, 'grade.epy', {
    'title': 'Preview Exam',
    'course': cur_course_user.course.name,
    'studentName': exam_answer.course_user.user.get_full_name(),
    'isPreview' : True,
    'solutionsExist': bool(exam_answer.exam.solutions_pdf.name)
  })


@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def edit_created_exam(request, cur_course_user, exam_answer_id):
  """
  Called when the instructor wants to edit his exam. Delete the fake exam_answer
  and redirects to creation page
  """
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  exam = exam_answer.exam

  exam_answers = models.ExamAnswer.objects.filter(exam=exam,
    course_user=cur_course_user, preview=True)
  exam_answers.delete()
  return shortcuts.redirect('/course/%d/exams/create/%d/' %
        (cur_course_user.course.pk, exam.pk))


@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def save_created_exam(request, cur_course_user, exam_answer_id):
  """
  Called when the instructor is done viewing exam preview. Deletes the fake exam_answer
  and redirects the user. The exam was already saved so we don't need tp save it
  again
  """
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  exam = exam_answer.exam

  exam_answers = models.ExamAnswer.objects.filter(exam=exam,
    course_user=cur_course_user, preview=True)
  exam_answers.delete()
  return shortcuts.redirect('/course/%d/exams/' % (cur_course_user.course.pk))


