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
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  question_parts = models.QuestionPart.objects.filter(exam=exam_answer.exam.pk)

  serializer = serializers.QuestionPartSerializer(question_parts, many=True)
  return response.Response(serializer.data)


# TODO: evalute security concerns of csrf exempt
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
      data=request.DATA)

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


def _get_previous_student_exam_answer(cur_exam_answer):
  """
  Given a particular student's exam, returns the exam_answer for the previous
  student, ordered alphabetically by last name, then first name, then email.
  If there is no previous student, the same student is returned.
  """

  exam_answers = models.ExamAnswer.objects.filter(exam=cur_exam_answer.exam, preview=False).order_by(
    'course_user__user__last_name', 'course_user__user__first_name', 'course_user__user__email')
  previous_exam_answer = None

  for exam_answer in exam_answers:
    # Match is found
    if exam_answer.id == cur_exam_answer.pk:
      # No previous student, so stay at same student
      if previous_exam_answer is None:
        return cur_exam_answer
      else:
        return previous_exam_answer
    # No match yet. Update previous_exam_answer
    else:  
      previous_exam_answer = exam_answer


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
  previous_exam_answer = _get_previous_student_exam_answer(cur_exam_answer)

  return response.Response({
    'student_path': '/course/%d/grade/%d/' % (cur_course_user.course.pk,
      previous_exam_answer.pk)
  })


@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def get_previous_student_jpeg(request, cur_course_user, exam_answer_id, question_number, part_number):
  """
  Gets the jpeg corresponding to question_number and part_number for the previous student
  If there is no previous student, the same student is returned.
  """

  # Get the exam of the current student
  cur_exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)

  # Get the exam of the next student  
  previous_exam_answer = _get_previous_student_exam_answer(cur_exam_answer)

  # Get the question_answer to find which page question_number and part_number lie on
  question_part = shortcuts.get_object_or_404(models.QuestionPart, exam=previous_exam_answer.exam,
    question_number=question_number, part_number=part_number)
  question_part_answer = shortcuts.get_object_or_404(models.QuestionPartAnswer,
    exam_answer=previous_exam_answer, question_part=question_part)

  return grade_or_view.get_exam_jpeg(request, cur_course_user, previous_exam_answer.pk, 
    int(question_part_answer.pages.split(',')[0]))


def _get_next_student_exam_answer(cur_exam_answer):
  """
  Given a particular student's exam, returns the exam_answer for the next
  student, ordered alphabetically by last name, then first name, then email.
  If there is no next student, the same student is returned.
  """
  found_exam_answer = False
  exam_answers = models.ExamAnswer.objects.filter(exam=cur_exam_answer.exam, preview=False).order_by(
    'course_user__user__last_name', 'course_user__user__first_name', 'course_user__user__email')

  for exam_answer in exam_answers:
    # Match is found
    if exam_answer.id == cur_exam_answer.pk:  
      found_exam_answer = True
    elif found_exam_answer:
      return exam_answer

  # If the exam was the last one
  if found_exam_answer:  
    return cur_exam_answer


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
  next_exam_answer = _get_next_student_exam_answer(cur_exam_answer)

  return response.Response({
    'student_path': '/course/%d/grade/%d/' % (cur_course_user.course.pk,
      next_exam_answer.pk)
  })


@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def get_next_student_jpeg(request, cur_course_user, exam_answer_id, question_number, part_number):
  """
  Gets the jpeg corresponding to question_number and part_number for the next student
  If there is no next student, the same student is returned.
  """
  
  # Get the exam of the current student
  cur_exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  
  # Get the exam of the next student
  next_exam_answer = _get_next_student_exam_answer(cur_exam_answer)

  # Get the question_part_answer to find which page question_number and part_number lie on
  question_part = shortcuts.get_object_or_404(models.QuestionPart, exam=next_exam_answer.exam,
    question_number=question_number,part_number=part_number)
  question_part_answer = shortcuts.get_object_or_404(models.QuestionPartAnswer,
    exam_answer=next_exam_answer, question_part=question_part)

  return grade_or_view.get_exam_jpeg(request, cur_course_user, next_exam_answer.pk, 
    int(question_part_answer.pages.split(',')[0]))


@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def modify_custom_rubric(request, cur_course_user, exam_answer_id):
  """
  Modifies the custom point value for a custom rubric. Parameters are passed in
  the POST body.
  """

  # Get POST variables
  custom_points = request.POST['custom_points']
  custom_rubric_id = request.POST['custom_rubric_id']

  custom_rubric = shortcuts.get_object_or_404(models.GradedRubric, pk=custom_rubric_id)
  custom_rubric.custom_points = custom_points
  custom_rubric.save()

  return http.HttpResponse(status=200)


@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def save_graded_rubric(request, cur_course_user, exam_answer_id):
  """
  Given a rubric_id, either add a graded_rubric corresponding to that rubric (if
  add_or_delete == 'add') or else delete the graded_rubric corresponding to that
  rubric. For custom rubrics, the rubric_id is blank. For non-custom rubrics,
  the custom_points and custom_rubric_id parameters are blank.
  """

  # TODO (cglu): what if this isn't a POST request, or there are no POST params?
  # Get POST variables
  question_number = request.POST['cur_question_num']
  part_number = request.POST['cur_part_num']
  add_or_delete = request.POST['add_or_delete']
  rubric_id = request.POST['rubric_num']
  try:
    custom_points = request.POST['custom_points']
    custom_rubric_id = request.POST['custom_rubric_id']
  except:
    pass

  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  question_part = shortcuts.get_object_or_404(models.QuestionPart, exam=exam_answer.exam,
    question_number=question_number, part_number=part_number)
  question_part_answer = shortcuts.get_object_or_404(models.QuestionPartAnswer,
    exam_answer=exam_answer_id, question_part=question_part)

  if rubric_id != '':  # If the saved rubric is not a custom rubric
    rubric = shortcuts.get_object_or_404(models.Rubric, pk=rubric_id)
  if add_or_delete == 'add':
    # Update the question_part_answer's grader to this current person
    question_part_answer.grader = cur_course_user
    question_part_answer.graded = True
    question_part_answer.save()

    # Create and save the new graded_rubric (this marks the rubric as graded)
    if rubric_id != '':
      graded_rubric = models.GradedRubric(question_part_answer=question_part_answer,
        question_part=question_part, rubric=rubric)
    else:
      graded_rubric = models.GradedRubric(question_part_answer=question_part_answer,
        question_part=question_part, custom_points=custom_points)
    graded_rubric.save()
  else:
    if rubric_id != '':
      graded_rubric = shortcuts.get_object_or_404(models.GradedRubric, rubric=rubric,
        question_part_answer=question_part_answer)
    else:
      graded_rubric = shortcuts.get_object_or_404(models.GradedRubric, rubric=None,
        question_part_answer=question_part_answer, question_part__question_number=question_number,
        question_part__part_number=part_number)
    graded_rubric.delete()  # Effectively unmarks the rubric as graded

    # Check whether the question part answer is still graded or not.
    num_graded_rubrics = models.GradedRubric.objects.filter(
      question_part_answer=question_part_answer).count()
    if num_graded_rubrics == 0:
      question_part_answer.graded = False
      question_part_answer.save()

  return http.HttpResponse(status=200)


@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def save_comment(request, cur_course_user, exam_answer_id):
  """
  The comment to be saved should be given as a POST parameter. Saves the comment
  in the associated question_part_answer.
  """

  # Get POST parameters
  question_number = request.POST['cur_question_num']
  part_number = request.POST['cur_part_num']
  comment = request.POST['comment']

  question_part_answer = shortcuts.get_object_or_404(models.QuestionPartAnswer,
    exam_answer=exam_answer_id, question_part__question_number=question_number,
    question_part__part_number=part_number)
  question_part_answer.grader_comments = comment
  question_part_answer.save()

  return http.HttpResponse(status=200)


@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def delete_comment(request, cur_course_user, exam_answer_id):
  """
  The comment for the associated question_part_answer is deleted.
  """

  # Get POST parameters
  question_number = request.POST['cur_question_num']
  part_number = request.POST['cur_part_num']

  question_part_answer = shortcuts.get_object_or_404(models.QuestionPartAnswer,
    exam_answer=exam_answer_id, question_part__question_number=question_number,
    question_part__part_number=part_number)
  question_part_answer.grader_comments = ''
  question_part_answer.save()

  return http.HttpResponse(status=200)