from django import shortcuts, http
from classallyapp import models, decorators
import json


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def get_exam_page_mappings(request, cur_course_user, exam_answer_id):
  """
  Returns a JSON representation of the pages associated with each question
  part, specifically an array of arrays. The inner array holds the pages
  corresponding to a particular question part, and the outer array contains all
  of the question part pages arrays.
  """

  question_answers = models.QuestionAnswer.objects.filter(exam_answer=exam_answer_id
    ).order_by('question__question_number', 'question__part_number')

  pages_to_return = []
  for question_answer in question_answers:
    pages = [int(page) for page in question_answer.pages.split(',')]
    pages_to_return.append(pages)

  return http.HttpResponse(json.dumps(pages_to_return), mimetype='application/json')


@decorators.login_required
@decorators.course_required
def get_rubrics(request, cur_course_user, exam_answer_id, question_number, part_number):
  """
  Returns rubrics, merged from rubrics and graded rubrics, associated with the
  particular question number and part number as JSON.

  The resulting rubrics have the following fields: description, points, custom
  (bool), and selected (bool).
  """
  # Get the corresponding exam answer
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)

  # Get the question corresponding to the question number and part number
  question = shortcuts.get_object_or_404(models.Question, exam=exam_answer.exam_id,
      question_number=question_number, part_number=part_number)

  question_answer = shortcuts.get_object_or_404(models.QuestionAnswer,
    exam_answer=exam_answer, question=question)

  # Get the rubrics and graded rubrics associated with the particular exam and
  # question part.
  rubrics = (models.Rubric.objects.filter(question=question)
    .order_by('question__question_number', 'question__part_number', 'id'))
  graded_rubrics = (models.GradedRubric.objects.filter(question=question,
    question_answer=question_answer).order_by('question__question_number',
    'question__part_number', 'id'))

  rubrics_to_return = {
    'rubrics': [],
    'graded': False,
    'points': question.max_points,
    'maxPoints': question.max_points,
    'questionNumber': question_number,
    'partNumber': part_number,
  }

  if question_answer.grader is not None:
    user = question_answer.grader.user
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
    # TODO: Make more efficient than O(N^2)?
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
    custom_graded_rubric = models.GradedRubric.objects.get(question=question, rubric=None,
      question_answer=question_answer)
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
    question_answer = models.QuestionAnswer.objects.get(exam_answer=exam_answer,
      question=question)
  except models.QuestionAnswer.DoesNotExist:
    return http.HttpResponse(status=422)

  rubrics_to_return['comment'] = False
  if len(question_answer.grader_comments) > 0:
    rubrics_to_return['graderComments'] = question_answer.grader_comments
    rubrics_to_return['comment'] = True

  return http.HttpResponse(json.dumps(rubrics_to_return), mimetype='application/json')


@decorators.login_required
@decorators.course_required
def get_exam_summary(request, cur_course_user, exam_answer_id, question_number, part_number):
  """
  Returns the questions and question answers as JSON.
  """
  exam_to_return = get_summary_for_exam(exam_answer_id, int(question_number), int(part_number))
  return http.HttpResponse(json.dumps(exam_to_return), mimetype='application/json')


@decorators.login_required
@decorators.course_required
def get_exam_jpeg(request, cur_course_user, exam_answer_id, page_number):
  """ Returns the URL where the jpeg of the empty uploaded exam can be found """
  exam_page = shortcuts.get_object_or_404(models.ExamAnswerPage, exam_answer_id=exam_answer_id,
   page_number=page_number)
  # return http.HttpResponse(exam_page.page_jpeg, mimetype='image/jpeg')
  return shortcuts.redirect(exam_page.page_jpeg.url)


@decorators.login_required
@decorators.course_required
def get_exam_solutions_pdf(request, cur_course_user, exam_answer_id):
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  return shortcuts.redirect(exam_answer.exam.solutions_pdf.url)


@decorators.login_required
@decorators.course_required
def get_exam_pdf(request, cur_course_user, exam_answer_id):
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  return shortcuts.redirect(exam_answer.pdf.url)


@decorators.login_required
@decorators.course_required
def get_exam_page_count(request, cur_course_user, exam_answer_id):
  """ Returns the number of pages in the exam_answer """
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  return http.HttpResponse(exam_answer.page_count)


def get_summary_for_exam(exam_answer_id, question_number=0, part_number=0):
  # TODO; bad description; doesn't return json
  """
  Returns the questions and question answers as JSON.

  The resulting questions have the following fields: points, maxPoints, graded
  (bool), and a list of objects representing a particular question part. Each
  of these question part objects have the following fields: questionNum,
  partNum, active (bool), partPoints, and maxPoints. 
  """

  # Get the corresponding exam answer
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)

  # Get the questions and question answers. Will be used for the exam
  # navigation.
  questions = models.Question.objects.filter(exam=exam_answer.exam).order_by(
    'question_number', 'part_number')

  exam_to_return = {
      'points': 0,
      'maxPoints': 0,
      'graded': True,
      'questions': [],
      'examAnswerId': exam_answer_id
  }

  cur_question = 0

  for question in questions:
    if question.question_number != cur_question:
      new_question = {}
      new_question['questionNumber'] = question.question_number
      exam_to_return['questions'].append(new_question)
      cur_question += 1

    cur_last_question = exam_to_return['questions'][-1]
    if 'parts' not in cur_last_question:
      cur_last_question['parts'] = []
    
    cur_last_question['parts'].append({})
    part = cur_last_question['parts'][-1]
    part['partNumber'] = question.part_number
    part['graded'] = False

    # Set active field
    part['active'] = False
    if (question.question_number == int(question_number) and
        question.part_number == int(part_number)):
      part['active'] = True

    part['maxPartPoints'] = question.max_points
    exam_to_return['maxPoints'] += question.max_points

    # Set the part points. We are assuming that we are grading up.
    part['partPoints'] = question.max_points  # Only works for grading up.
    graded_rubrics = models.GradedRubric.objects.filter(question=question,
      question_answer__exam_answer=exam_answer)
    for graded_rubric in graded_rubrics:
      part['graded'] = True
      if graded_rubric.rubric is not None:
        part['partPoints'] += graded_rubric.rubric.points
      else:  # TODO: Error-handling if for some reason both are null?
        part['partPoints'] += graded_rubric.custom_points

    # Set the grader.
    question_answer = shortcuts.get_object_or_404(models.QuestionAnswer,
      question=question, exam_answer=exam_answer)
    if question_answer.grader is not None:
      part['grader'] = question_answer.grader.user.get_full_name()

    # Update the overall exam
    if not part['graded']:  # If a part is ungraded, the exam is ungraded
      exam_to_return['graded'] = False
    else:  # If a part is graded, update the overall exam points
      exam_to_return['points'] += part['partPoints']

  return exam_to_return
