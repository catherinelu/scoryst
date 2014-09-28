from rest_framework import serializers
from scorystapp import models


class AssessmentSerializer(serializers.ModelSerializer):
  has_submissions = serializers.SerializerMethodField('compute_has_submissions')
  is_released = serializers.SerializerMethodField('compute_is_released')

  def compute_has_submissions(self, assessment):
    """ Returns True if one or more submissions exist for the assessment, else False """
    return assessment.submission_set.count() > 0

  def compute_is_released(self, assessment):
    """ Returns True if the assessment is visible to the current course user """
    cur_course_user = self.context['cur_course_user']
    if cur_course_user.privilege != models.CourseUser.STUDENT:
      return True

    submissions = assessment.submission_set.filter(course_user=cur_course_user,
      last=True, released=True)
    # If there exists a submission that has been released, return True
    return submissions.count() > 0

  class Meta:
    model = models.Assessment
    fields = ('id', 'name', 'has_submissions', 'is_released')
    read_only_fields = ('id', 'name')


class CourseUserGradedSerializer(serializers.ModelSerializer):
  """
  Used by grade overview giving details of each course user along with
  grader information for each question
  """
  full_name = serializers.CharField(source='user.get_full_name', read_only=True)
  student_id = serializers.CharField(source='user.student_id', read_only=True)
  email = serializers.CharField(source='user.email', read_only=True)

  submission_id = serializers.SerializerMethodField('get_submission_id')
  is_mapped = serializers.SerializerMethodField('get_is_mapped')
  questions_info = serializers.SerializerMethodField('get_questions_info')


  def get_submission_id(self, course_user):
    """
    Returns submission_id for the course_user if one exists, None otherwise.
    """
    if self.context['is_student']:
      submissions = filter(lambda sub: sub.course_user == course_user or
        course_user in sub.group_members.all(), self.context['submissions'])
    else:
      submissions = filter(lambda sub: sub.course_user == course_user,
        self.context['submissions'])

    if len(submissions) == 0:
      return None
    else:
      submission = max(submissions, key=lambda s: s.pk)
      return submission.pk


  def get_is_mapped(self, course_user):
    """
    Returns whether or not the course user is mapped to an assessment answer for
    the given assessment.
    """
    return False if self.get_submission_id(course_user) == None else True


  # TODO: Im still not happy with the way we treat questions, I'm doing aggregation
  # for questions for a single student for student summary in backbone, but im doing
  # this crap here. Should this be done in backbone too, after just returning
  # all the question part answers? Should the other thing be done in the backend
  # There's also some inconsistency in the way we do it. It's not a big deal for now
  # but it might be soon enough. Discuss with Karthik and Squishy.
  def get_questions_info(self, course_user):
    """
    Returns info about each question for the grade overview page. 0th index
    refers to all questions, index i refers to question i.
    """
    assessment = self.context['assessment']
    num_questions = self.context['num_questions']
    submissions = self.context['submissions']
    all_questions_info = self.context['questions_info']

    questions_info = []
    submission_points = 0

    submission_graded = True
    submission_graders = []
    submission_max_points = 0

    for question_number in range(1, num_questions + 1):
      cur_question_info = filter(lambda info: info['course_user_id'] == course_user.id,
        all_questions_info[question_number])

      if len(cur_question_info) == 0:
        questions_info.append({
          'graded': False
        })
        submission_graded = False
      else:
        cur_question_info = cur_question_info[0].copy()
        del cur_question_info['course_user_id']

        questions_info.append(cur_question_info)
        submission_points += cur_question_info['points']

        submission_graded = submission_graded and cur_question_info['graded']
        submission_graders.extend(cur_question_info['graders'])
        submission_max_points += cur_question_info['max_points']

        cur_question_info['graders'] = ', '.join(cur_question_info['graders'])

    questions_info.insert(0, {
      'graded': submission_graded,
      'graders': ', '.join(submission_graders),
      'points': round(submission_points, 2),
      'max_points': submission_max_points,
    })

    return questions_info

  class Meta:
    model = models.CourseUser
    fields = ('id', 'full_name', 'student_id', 'email', 'is_mapped',
      'questions_info', 'submission_id')
    read_only_fields = ('id',)
