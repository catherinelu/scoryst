from django import shortcuts, http
from scorystapp import models, forms, decorators, serializers
from scorystapp.views import helpers, grade_or_view
from rest_framework import decorators as rest_decorators, response


@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def grade(request, cur_course_user, exam_answer_id):
  """ Allows an instructor/TA to grade an exam. """
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)

  return helpers.render(request, 'grade.epy', {
    'title': 'Grade',
    'course': cur_course_user.course.name,
    'studentName': exam_answer.course_user.user.get_full_name(),
    'solutionsExist': True if exam_answer.exam.solutions_pdf.name else False
  })


# TODO: confirm security is OK for the API methods below
@rest_decorators.api_view(['GET'])
@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def list_question_parts(request, cur_course_user, exam_answer_id):
  """ Returns a list of QuestionPartAnswers for the provided Exam. """
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id,
    course_user__course=cur_course_user.course.pk)
  question_parts = models.QuestionPart.objects.filter(exam=exam_answer.exam.pk)

  serializer = serializers.QuestionPartSerializer(question_parts, many=True)
  return response.Response(serializer.data)


@rest_decorators.api_view(['GET', 'PUT'])
@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def manage_question_part_answer(request, cur_course_user, exam_answer_id, question_part_id):
  """ Returns a list of QuestionPartAnswers for the provided Exam. """
  question_part_answer = shortcuts.get_object_or_404(models.QuestionPartAnswer,
    exam_answer=exam_answer_id, question_part=question_part_id)

  if request.method == 'GET':
    # user wants to get a question answer
    serializer = serializers.QuestionPartAnswerSerializer(question_part_answer)
    return response.Response(serializer.data)
  elif request.method == 'PUT':
    # user wants to update a question answer
    serializer = serializers.QuestionPartAnswerSerializer(question_part_answer,
      data=request.DATA, context=request)

    if serializer.is_valid():
      serializer.save()
      return response.Response(serializer.data)
    return response.Response(serializer.errors, status=422)


@rest_decorators.api_view(['GET'])
@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def list_rubrics(request, cur_course_user, exam_answer_id, question_part_id):
  """ Returns a list of Rubrics for the provided QuestionPart. """
  rubrics = models.Rubric.objects.filter(question_part=question_part_id)
  serializer = serializers.RubricSerializer(rubrics, many=True)
  return response.Response(serializer.data)


@rest_decorators.api_view(['GET'])
@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def get_previous_student(request, cur_course_user, exam_answer_id):
  """
  Given a particular student's exam, returns the grade page for the previous
  student, ordered alphabetically by last name, then first name, then email.
  If there is no previous student, the same student is returned.
  """
  cur_exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  previous_exam_answer = _get_offset_student_exam(exam_answer_id, -1)

  return response.Response({
    'student_path': '/course/%d/grade/%d/' % (cur_course_user.course.pk,
      previous_exam_answer.pk),
    'student_name': previous_exam_answer.course_user.user.get_full_name(),
  })


@rest_decorators.api_view(['GET'])
@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def get_next_student(request, cur_course_user, exam_answer_id):
  """
  Given a particular student's exam, returns the grade page for the next
  student, ordered alphabetically by last name, then first name, then email.
  If there is no next student, the same student is returned.
  """
  cur_exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  next_exam_answer = _get_offset_student_exam(exam_answer_id, 1)

  return response.Response({
    'student_path': '/course/%d/grade/%d/' % (cur_course_user.course.pk,
      next_exam_answer.pk),
    'student_name': next_exam_answer.course_user.user.get_full_name(),
  })


def _get_offset_student_exam(exam_answer_id, offset):
  """
  Gets the exam for the student present at 'offset' from the current student.
  If there is no student at that offset, the student at one of the bounds (0 or last index)
  is returned.
  """
  
  offset = int(offset)
  exam_answer_id = int(exam_answer_id)

  # Get the exam of the current student
  cur_exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)

  # Fetch all exam answers
  exam_answers = models.ExamAnswer.objects.filter(exam=cur_exam_answer.exam, preview=False).order_by(
    'course_user__user__last_name', 'course_user__user__first_name', 'course_user__user__email')

  # Calculate the index of the current exam answer
  for cur_index, exam_answer in enumerate(exam_answers):
    if exam_answer_id == exam_answer.id:
      break
  
  total = exam_answers.count()

  # Fetch the index at offset from current, if possible, else return a bound
  if cur_index + offset >= 0 and cur_index + offset < total:
    next_index = cur_index + offset
  elif cur_index + offset < 0:
    next_index = 0
  else:
    next_index = total - 1

  # Get the exam answer correspodning to the index
  next_exam_answer = exam_answers[next_index]
  return next_exam_answer


@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def get_offset_student_jpeg(request, cur_course_user, exam_answer_id, offset, question_number, part_number):
  """
  Gets the jpeg corresponding to question_number and part_number for the student
  present at 'offset' from the current student.
  If there is no student at that offset, the student at one of the bounds (0 or last index)
  is returned.
  """
  # Ensure the exam_answer_id exists
  cur_exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)

  next_exam_answer = _get_offset_student_exam(exam_answer_id, offset)

  # Get the question_part_answer to find which page question_number and part_number lie on
  question_part = shortcuts.get_object_or_404(models.QuestionPart, exam=next_exam_answer.exam,
    question_number=question_number,part_number=part_number)
  question_part_answer = shortcuts.get_object_or_404(models.QuestionPartAnswer,
    exam_answer=next_exam_answer, question_part=question_part)

  return grade_or_view.get_exam_jpeg(request, cur_course_user, next_exam_answer.pk, 
    int(question_part_answer.pages.split(',')[0]))
