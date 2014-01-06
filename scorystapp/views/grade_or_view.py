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
    part['partPoints'] = question_part_answer.get_points()
    part['graded'] = question_part_answer.graded

    # Set the grader.
    if question_part_answer.grader is not None:
      part['grader'] = question_part_answer.grader.user.get_full_name()

    # Update the overall exam
    if not part['graded']:  # If a part is ungraded, the exam is ungraded
      exam_to_return['graded'] = False
    else:  # If a part is graded, update the overall exam points
      exam_to_return['points'] += part['partPoints']

  return exam_to_return
