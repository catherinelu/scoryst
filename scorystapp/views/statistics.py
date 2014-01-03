# TODO: Better file name?
from scorystapp import models


def _get_exam_score(exam_answer):
  """
  Returns a tuple of the (is_graded, score) where is_graded is True if the exam_answer
  is fully graded, False otherwise, and score is the score of the student
  """
  grade_down = exam_answer.exam.grade_down
  question_part_answers = models.QuestionPartAnswer.objects.filter(exam_answer=exam_answer)
  
  points = 0
  custom_points = 0
  total_exam_points = 0
  is_entire_exam_graded = True

  for question_part_answer in question_part_answers:
    # Initialize part_graded to False. Will be set to true if it has a graded
    # rubric associated with it.
    part_graded = False
    total_exam_points += question_part_answer.question_part.max_points

    for graded_rubric in question_part_answer.rubrics.all():
      points += graded_rubric.points
      part_graded = True

    if question_part_answer.custom_points is not None:
      custom_points += question_part_answer.custom_points
      part_graded = True

    if not part_graded:
      is_entire_exam_graded = False

  score = 0
  if grade_down:
    score = total_exam_points - points + custom_points
  else:
    score = points + custom_points

  return is_entire_exam_graded, score
