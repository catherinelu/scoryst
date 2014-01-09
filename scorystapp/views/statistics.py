from django import shortcuts, http
from scorystapp import models, decorators
from scorystapp.views import helpers
import json
# TODO: Add numpy and all those things to requirements.txt
import numpy as np
# TODO: Inefficient, optimize it later

# TODO: Anyone with an account can see statistics as of now, Fix
@decorators.login_required
@decorators.valid_course_user_required
def statistics(request, cur_course_user):
  """ Overview of all of the students' exams and grades for a particular exam. """
  cur_course = cur_course_user.course
  exams = models.Exam.objects.filter(course=cur_course.pk)

  return helpers.render(request, 'statistics.epy', {
    'title': 'Statistics',
    'exams': exams,
    'is_student': cur_course_user.privilege == models.CourseUser.STUDENT
  })


@decorators.login_required
@decorators.valid_course_user_required
def get_statistics(request, cur_course_user, exam_id):
  exam = shortcuts.get_object_or_404(models.Exam, pk=exam_id)
  statistics = {
    'exam_statistics': _get_exam_statistics(exam),
    'question_parts_statistics': _get_all_question_part_statistics(exam)
  }
  return http.HttpResponse(json.dumps(statistics), mimetype='application/json')


def _mean(scores):
  """
  Calculates the mean among the scores
  """
  num_scores = len(scores)
  return sum(scores)/num_scores if num_scores else 0


def _median(scores):
  """
  Calculates the median among the scores
  """
  num_scores = len(scores)
  sorted_scores = sorted(scores)

  # In case no scores are provided
  if num_scores == 0: return 0

  if num_scores % 2 == 0:
    return (sorted_scores[num_scores/2 - 1] + sorted_scores[num_scores/2])/2
  else:
    return sorted_scores[num_scores/2]


def _standard_deviation(scores):
  """
  Calculates the standard deviation among scores
  """
  num_scores = len(scores)
  if num_scores == 0: return 0

  mean = _mean(scores)
  sum_x2 = sum(score**2 for score in scores)
  return (sum_x2/num_scores - mean ** 2) ** 0.5


def _min(scores):
  """ 
  Calculates the min among the scores
  """
  return min(scores) if len(scores) else 0


def _max(scores):
  """ 
  Calculates the max among the scores
  """
  return max(scores) if len(scores) else 0


def _get_exam_statistics(exam):
  """
  Calculates the median, mean, max, min and standard deviation among all the exams
  that have been graded.
  """
  exam_answers = models.ExamAnswer.objects.filter(exam=exam, preview=False)
  graded_exam_scores = [e.get_points() for e in exam_answers if e.is_graded()]

  return {
    'id': exam.id,
    'median': _median(graded_exam_scores),
    'mean': _mean(graded_exam_scores),
    'max': _max(graded_exam_scores),
    'min': _min(graded_exam_scores),
    'std_dev': _standard_deviation(graded_exam_scores),
    'histogram': _get_histogram(graded_exam_scores)
  }


def _get_question_part_statistics(question_part):
  """
  Calculates the median, mean, max, min and standard deviation among all the exams
  for which this question_part has been graded.
  """
  question_part_answers = models.QuestionPartAnswer.objects.filter(question_part=question_part)
  graded_question_part_scores = [qp.get_points() for qp in question_part_answers if qp.graded]

  return {
    'id': question_part.exam.id,
    'question_number': question_part.question_number,
    'part_number': question_part.part_number,
    'median': _median(graded_question_part_scores),
    'mean': _mean(graded_question_part_scores),
    'max': _max(graded_question_part_scores),
    'min': _min(graded_question_part_scores),
    'std_dev': _standard_deviation(graded_question_part_scores)
  }


def _get_all_question_part_statistics(exam):
  """
  Calculates the median, mean, max, min and standard deviation for all question_parts
  in the exam
  """
  question_parts_statistics = []
  question_parts = models.QuestionPart.objects.filter(exam=exam).order_by(
    'question_number', 'part_number')

  for question_part in question_parts:
    question_parts_statistics.append(_get_question_part_statistics(question_part))

  return question_parts_statistics


def _get_histogram(scores):
  """
  Returns a histogram of the scores of the form {
    'range_1_start-range_1_end': number_1,
    'range_2start-range_2_end': number_2,
  }
  """
  sorted_scores = sorted(scores)
  num_scores = len(scores)
  
  max_score = scores[num_scores - 1]
  step_size = _get_step_size(max_score)
  
  bins = [0]
  curr = 0
  labels = []
  
  while curr < max_score:
    labels.append('%d-%d' % (curr, curr + step_size))
    curr += step_size
    bins.append(curr)

  hist, bin_edges = np.histogram(scores, bins=bins)
  
  return {
    'labels': labels,
    'histogram': hist.tolist()
  }


def _get_step_size(max_score):
  """
  Calculates the appropriate step size for our histogram.
  """
  if max_score > 1000:
    # Then the person who made this exam is a retard
    step_size = 200
  elif max_score > 500:
    step_size = 100
  elif max_score > 250:
    step_size = 50
  elif max_score > 100:
    step_size = 20
  elif max_score > 50:
    step_size = 10
  elif max_score > 20:
    step_size = 5
  elif max_score > 10:
    step_size = 2
  else:
    step_size = 1
  return step_size
