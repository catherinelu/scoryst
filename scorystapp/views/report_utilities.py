import __builtin__
import numpy as np
import itertools
import collections

def percentile(scores, student_score):
  """ Calculates percentile for the student_score """
  scores = np.array(sorted(scores))
  num_scores = len(scores)
  return round(sum(scores <= student_score) / float(num_scores) * 100, 2)


def mean(scores, is_rounded=True):
  """ Calculates the mean among the scores """
  num_scores = len(scores)
  mean_score = sum(scores)/num_scores if num_scores else 0
  return round(mean_score, 2) if is_rounded else mean_score


def median(scores):
  """ Calculates the median among the scores """
  num_scores = len(scores)
  sorted_scores = sorted(scores)

  # In case no scores are provided
  if num_scores == 0: return 0

  if num_scores % 2 == 0:
    median_score = (sorted_scores[num_scores/2 - 1] + sorted_scores[num_scores/2])/2
  else:
    median_score = sorted_scores[num_scores/2]
  return round(median_score, 2)


def standard_deviation(scores):
  """ Calculates the standard deviation among scores """
  num_scores = len(scores)
  if num_scores == 0: return 0

  mean_score = mean(scores, False)
  sum_x2 = sum(score**2 for score in scores)
  std_dev_score = (sum_x2/num_scores - mean_score ** 2) ** 0.5
  return round(std_dev_score, 2)


def max(scores):
  """ Calculates the max among the scores """
  return __builtin__.max(scores) if len(scores) else 0


def get_histogram(scores):
  """
  Returns a histogram of the scores of the form {
    'range_1_start-range_1_end': number_1,
    'range_2_start-range_2_end': number_2,
  }
  """
  sorted_scores = sorted(scores)
  num_scores = len(scores)

  if num_scores == 0:
    return {
      'labels': ['0-0'],
      'histogram': [0]
    }
  max_score = sorted_scores[num_scores - 1]
  step_size = _get_step_size(max_score)

  bins = [0]
  curr = 0
  labels = []

  while curr < max_score:
    labels.append('[%d, %d)' % (curr, curr + step_size))
    curr += step_size
    bins.append(curr)
  # The last bin's upper score is inclusive, so change ) to ]

  # If the step size is 1
  if step_size == 1:
    bins.append(curr)
    labels.append('%d' % curr)
  elif labels:
    labels[-1] = labels[-1][:-1] + ']'

  hist, bin_edges = np.histogram(scores, bins=bins)

  return {
    'labels': labels,
    'histogram': hist.tolist()
  }


def _get_step_size(max_score):
  """ Calculates the appropriate step size for our histogram. """
  if max_score > 1000:
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


def merge_values(values, return_as_list=True):
  """
  When you call values() on a queryset where the Model has a ManyToManyField
  and there are multiple related items, it returns a separate dictionary for each
  related item. This function merges the dictionaries so that there is only
  one dictionary per id at the end, with lists of related items for each.

  https://gist.github.com/pamelafox-coursera/3707015
  TODO: Catherine, we assume values is ordered by id, so make this cleaner
  """
  grouped_results = itertools.groupby(values, key=lambda value: value['id'])

  merged_values = [] if return_as_list else collections.Counter()

  for _, g in grouped_results:
    groups = list(g)
    merged_value = {}
    for group in groups:
      for key, val in group.iteritems():
        if not merged_value.get(key):
          merged_value[key] = [val]
        elif val != merged_value[key]:
          if isinstance(merged_value[key], list):
            if val not in merged_value[key]:
              merged_value[key].append(val)

    if return_as_list:
      merged_values.append(len(merged_value['group_members']))
    else:
      merged_values[merged_value['id'][0]] = len(merged_value['group_members'])

  return merged_values
