from scorystapp import models
# TODO: Inefficient, optimize it later

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
  if not num_scores: return 0

  if num_scores % 2 == 0:
    return (sorted_scores[num_scores/2 - 1] + sorted_scores[num_scores/2])/2
  else:
    return sorted_scores[num_scores/2]


def _standard_deviation(scores):
  """
  Calculates the standard deviation among scores
  """
  num_scores = len(scores)
  if not num_scores: return 0

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


def get_exam_statistics(exam):
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
    'std_dev': _standard_deviation(graded_exam_scores)
  }


def _get_question_part_statistics(question_part):
  """
  Calculates the median, mean, max, min and standard deviation among all the exams
  for which this question_part has been graded.
  """
  question_part_answers = models.QuestionPartAnswers.objects.filter(question_part=question_part)
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


def get_all_question_part_statistics(exam):
  """
  Calculates the median, mean, max, min and standard deviation for all question_parts
  in the exam
  """
  question_parts_statistics = []
  question_parts = models.QuestionPart.objects.filter(exam=exam)

  for question_part in question_parts:
    question_parts_statistics.append(_get_question_part_statistics(question_part))

  return question_parts_statistics
