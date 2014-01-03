from django import shortcuts, http
from scorystapp import models, decorators
import json


@decorators.login_required
@decorators.valid_course_user_required
@decorators.student_required
def get_exam_page_mappings(request, cur_course_user, exam_answer_id):
  """
  Returns a JSON representation of the pages associated with each question
  part, specifically an array of arrays. The inner array holds the pages
  corresponding to a particular question part, and the outer array contains all
  of the question part pages arrays.
  """

  question_part_answers = models.QuestionPartAnswer.objects.filter(exam_answer=exam_answer_id
    ).order_by('question_part__question_number', 'question_part__part_number')

  pages_to_return = []
  for question_part_answer in question_part_answers:
    pages = [int(page) for page in question_part_answer.pages.split(',')]
    pages_to_return.append(pages)

  return http.HttpResponse(json.dumps(pages_to_return), mimetype='application/json')


@decorators.login_required
@decorators.valid_course_user_required
@decorators.student_required
def get_rubrics(request, cur_course_user, exam_answer_id, question_number, part_number):
  """
  Returns rubrics, merged from rubrics and graded rubrics, associated with the
  particular question number and part number as JSON.

  The resulting rubrics have the following fields: description, points, custom
  (bool), and selected (bool).
  """
  # Get the corresponding exam answer
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)

  # Get the question_part corresponding to the question number and part number
  question_part = shortcuts.get_object_or_404(models.QuestionPart, exam=exam_answer.exam_id,
      question_number=question_number, part_number=part_number)

  question_part_answer = shortcuts.get_object_or_404(models.QuestionPartAnswer,
    exam_answer=exam_answer, question_part=question_part)

  # Get the rubrics and graded rubrics associated with the particular exam and
  # question part.
  rubrics = (models.Rubric.objects.filter(question_part=question_part)
    .order_by('question_part__question_number', 'question_part__part_number', 'id'))
  graded_rubrics = (models.GradedRubric.objects.filter(question_part=question_part,
    question_part_answer=question_part_answer).order_by('question_part__question_number',
    'question_part__part_number', 'id'))

  rubrics_to_return = {
    'rubrics': [],
    'graded': False,
    'points': question_part.max_points,
    'maxPoints': question_part.max_points,
    'questionNumber': question_number,
    'partNumber': part_number,
  }

  if question_part_answer.grader is not None:
    user = question_part_answer.grader.user
    rubrics_to_return['grader'] = (user.first_name + ' ' + user.last_name + ' ('
      + user.email + ')')

  # Merge the rubrics and graded rubrics into a list of rubrics (represented as
  # dicts) with the following fields: description, points, custom, and selected.
  for rubric in rubrics:
    cur_rubric = {
      'description': rubric.description,
      'points': rubric.points,
      'custom': False,
      'rubricPk': rubric.pk,
      'selected': False,
    }
    cur_rubric['color'] = 'red' if cur_rubric['points'] < 0 else 'green'

    # Iterate over graded rubrics and check if it is actually selected.
    for graded_rubric in graded_rubrics:
      if graded_rubric.rubric == rubric:
        cur_rubric['selected'] = True
        break
    rubrics_to_return['rubrics'].append(cur_rubric)

  # Adds up the points for the overall question part
  for graded_rubric in graded_rubrics:
    rubrics_to_return['graded'] = True
    # Check to see if there is a custom rubric.
    if graded_rubric.custom_points != None:
      rubrics_to_return['points'] += graded_rubric.custom_points
      is_custom_rubric = True
    else:
      rubrics_to_return['points'] += graded_rubric.rubric.points

  # Take care of the custom rubric case
  custom_rubric = {
    'description': 'Custom points',
    'custom': True,
  }

  # Add custom rubric to the end
  try:  # If a custom rubric exists
    custom_graded_rubric = models.GradedRubric.objects.get(question_part=question_part, rubric=None,
      question_part_answer=question_part_answer)
    custom_rubric['points'] = custom_graded_rubric.custom_points
    custom_rubric['selected'] = True
    custom_rubric['customRubricId'] = custom_graded_rubric.id
  except models.GradedRubric.DoesNotExist:
    custom_rubric['selected'] = False
    custom_rubric['points'] = 0
  custom_rubric['color'] = 'red' if custom_rubric['points'] < 0 else 'green'
  rubrics_to_return['rubrics'].append(custom_rubric)

  # Add in the comment field
  try:
    question_part_answer = models.QuestionPartAnswer.objects.get(exam_answer=exam_answer,
      question_part=question_part)
  except models.QuestionPartAnswer.DoesNotExist:
    return http.HttpResponse(status=422)

  rubrics_to_return['comment'] = False
  if len(question_part_answer.grader_comments) > 0:
    rubrics_to_return['graderComments'] = question_part_answer.grader_comments
    rubrics_to_return['comment'] = True

  return http.HttpResponse(json.dumps(rubrics_to_return), mimetype='application/json')


@decorators.login_required
@decorators.valid_course_user_required
@decorators.student_required
def get_exam_summary(request, cur_course_user, exam_answer_id, question_number, part_number):
  """
  Returns the questions and question answers as JSON.
  """
  exam_to_return = get_summary_for_exam(exam_answer_id, int(question_number), int(part_number))
  return http.HttpResponse(json.dumps(exam_to_return), mimetype='application/json')


@decorators.login_required
@decorators.valid_course_user_required
@decorators.student_required
def get_exam_jpeg(request, cur_course_user, exam_answer_id, page_number):
  """ Returns the URL where the jpeg of the empty uploaded exam can be found """
  exam_page = shortcuts.get_object_or_404(models.ExamAnswerPage, exam_answer_id=exam_answer_id,
   page_number=page_number)
  # return http.HttpResponse(exam_page.page_jpeg, mimetype='image/jpeg')
  return shortcuts.redirect(exam_page.page_jpeg.url)


@decorators.login_required
@decorators.valid_course_user_required
@decorators.student_required
def get_exam_solutions_pdf(request, cur_course_user, exam_answer_id):
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  return shortcuts.redirect(exam_answer.exam.solutions_pdf.url)


@decorators.login_required
@decorators.valid_course_user_required
@decorators.student_required
def get_exam_pdf(request, cur_course_user, exam_answer_id):
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  return shortcuts.redirect(exam_answer.pdf.url)


@decorators.login_required
@decorators.valid_course_user_required
@decorators.student_required
def get_exam_page_count(request, cur_course_user, exam_answer_id):
  """ Returns the number of pages in the exam_answer """
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  return http.HttpResponse(exam_answer.page_count)


def get_summary_for_exam(exam_answer_id, question_number=0, part_number=0):
  """
  Returns the questions and question answers as a dict.

  The resulting questions have the following fields: points, maxPoints, graded
  (bool), and a list of objects representing a particular question part. Each
  of these question part objects have the following fields: questionNum,
  partNum, active (bool), partPoints, and maxPoints. 

  The question_number and part_number are 0 by default, signifying that none of
  the question parts found should be marked as "active".
  """

  # Get the corresponding exam answer
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)

  # Get the questions and question answers. Will be used for the exam
  # navigation.
  question_parts = models.QuestionPart.objects.filter(exam=exam_answer.exam).order_by(
    'question_number', 'part_number')

  exam_to_return = {
      'points': 0,
      'maxPoints': 0,
      'graded': True,
      'questions': [],
      'examAnswerId': exam_answer_id
  }

  cur_question = 0

  for question_part in question_parts:
    if question_part.question_number != cur_question:
      new_question = {}
      new_question['questionNumber'] = question_part.question_number
      exam_to_return['questions'].append(new_question)
      cur_question += 1

    cur_last_question = exam_to_return['questions'][-1]
    if 'parts' not in cur_last_question:
      cur_last_question['parts'] = []
    
    cur_last_question['parts'].append({})
    part = cur_last_question['parts'][-1]
    part['partNumber'] = question_part.part_number
    part['graded'] = False

    # Set active field
    part['active'] = False
    if (question_part.question_number == int(question_number) and
        question_part.part_number == int(part_number)):
      part['active'] = True

    part['maxPartPoints'] = question_part.max_points
    exam_to_return['maxPoints'] += question_part.max_points

    question_part_answer = shortcuts.get_object_or_404(models.QuestionPartAnswer,
      question_part=question_part, exam_answer=exam_answer)

    # Set the part points. We are assuming that we are grading up.
    part['partPoints'] = question_part.max_points  # Only works for grading up.
    for graded_rubric in question_part_answer.rubrics.all():
      part['graded'] = True
      part['partPoints'] += graded_rubric.points
    if question_part_answer.custom_points is not None:
      part['partPoints'] += question_part_answer.custom_points

    # Set the grader.
    if question_part_answer.grader is not None:
      part['grader'] = question_part_answer.grader.user.get_full_name()

    # Update the overall exam
    if not part['graded']:  # If a part is ungraded, the exam is ungraded
      exam_to_return['graded'] = False
    else:  # If a part is graded, update the overall exam points
      exam_to_return['points'] += part['partPoints']

  return exam_to_return
