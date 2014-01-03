# TODO: Better file name?
from django import shortcuts, http
from scorystapp import models, decorators
import csv


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


@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def get_csv_for_exam(request, cur_course_user, exam_id):
  """
  Returns a csv of the form (last_name, first_name, email, score_in_exam)
  for each student who took the exam
  """
  exam = shortcuts.get_object_or_404(models.Exam, pk=exam_id)

  # Create the HttpResponse object with the appropriate CSV header.
  response = http.HttpResponse(content_type='text/csv')
  response['Content-Disposition'] = 'attachment; filename="%s_scores.csv"' % exam.name
  
  writer = csv.writer(response)

  exam_answers = models.ExamAnswer.objects.filter(exam=exam
    ).order_by('course_user__user__last_name')

  for exam_answer in exam_answers:
    user = exam_answer.course_user.user
    is_entire_exam_graded, score = _get_exam_score(exam_answer)

    # TODO: discuss
    # if is_entire_exam_graded:
    writer.writerow([user.last_name, user.first_name, user.email, score])

  return response
