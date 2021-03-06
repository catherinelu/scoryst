from django.db import connection

def get_question_info(submission_set, question_number, num_question_parts):
  """
  Performs crazy-ass raw SQL queries to get a list of `question_info` objects
  used by the grade overview page. A `question_info` object is of the form:
  {
    'points': ,
    'graded': true if the question is graded,
    'max_points': ,
    'course_user_id': ,
    'submission_id': ,
    'graders': list of graders,
  }
  """
  submission_ids = submission_set.values_list('id', flat=True)
  submission_ids_str = map(str, submission_ids)

  # In case of no submissions, submission_id IN (%s) will throw an error
  # submission_id in 0 makes it fail gracefully
  if len(submission_ids_str) == 0:
    submission_ids_str = ['0']

  cursor = connection.cursor()
  query = ("SELECT SUM(scorystapp_response.points) as total,"
    " COUNT(scorystapp_response.points) as count,"
    " SUM(scorystapp_questionpart.max_points) as max_points, course_user_id,"
    " submission_id FROM scorystapp_response INNER JOIN scorystapp_questionpart"
    " ON question_part_id = scorystapp_questionpart.id INNER JOIN"
    " scorystapp_submission ON submission_id = scorystapp_submission.id WHERE"
    " scorystapp_response.graded = TRUE and question_number = %d AND"
    " submission_id IN (%s) GROUP BY submission_id, course_user_id")

  cursor.execute(query % (question_number, ','.join(submission_ids_str)))
  results = cursor.fetchall()

  question_info_dict = {}
  for row in results:
    submission_id = row[4]
    question_info_dict[submission_id] = {
      'points': row[0],
      'graded': row[1] == num_question_parts,
      'max_points': row[2],
      'course_user_id': row[3],
      'graders': [],
    }

  query = ("SELECT DISTINCT CONCAT(first_name, ' ', last_name) as full_name,"
    " submission_id FROM scorystapp_user INNER JOIN scorystapp_courseuser ON"
    " user_id = scorystapp_user.id INNER JOIN scorystapp_response ON grader_id"
    " = scorystapp_courseuser.id INNER JOIN scorystapp_questionpart ON"
    " question_part_id = scorystapp_questionpart.id WHERE question_number = %d"
    " AND submission_id IN (%s) AND graded = TRUE")

  cursor.execute(query % (question_number, ','.join(submission_ids_str)))
  results = cursor.fetchall()

  for row in results:
    grader_name = row[0]
    submission_id = row[1]

    matching_question_info = question_info_dict[submission_id]
    matching_question_info['graders'].append(grader_name)

  return question_info_dict.values()


def get_graded_question_scores(submission_set, question_number,
    num_question_parts, num_group_members_map=None):
  """
  Returns a list of (points, num_graded) tuples where num_graded is the number
  of parts that were graded for the question.
  """
  # TODO: If last=False is graded, then this would be incorrect
  submission_ids = submission_set.values_list('id', flat=True)

  cursor = connection.cursor()
  query = ("SELECT SUM(points) as total, COUNT(points) as count, submission_id FROM"
    " scorystapp_response INNER JOIN scorystapp_questionpart ON"
    " question_part_id = scorystapp_questionpart.id WHERE graded = TRUE and"
    " question_number = %d AND submission_id IN (%s) GROUP BY submission_id"
    " ORDER BY submission_id")

  submission_ids_str = map(str, submission_ids)
  cursor.execute(query % (question_number, ','.join(submission_ids_str)))
  results = cursor.fetchall()

  # If `num_group_members_map` is none, then group submissions are not allowed
  if num_group_members_map is None:
    return [row[0] for row in results if row[1] == num_question_parts]

  graded_question_scores = []

  for points, num_graded, submission_id in results:
    # If all parts of the question are graded
    if num_graded == num_question_parts:
      # For each member in the group, append the score to the list
      count = num_group_members_map[submission_id]
      for _ in range(count):
        graded_question_scores.append(points)

  return graded_question_scores
