from rest_framework import serializers
from scorystapp import models

class QuestionPartSerializer(serializers.ModelSerializer):
  grade_down = serializers.BooleanField(source='exam.grade_down', read_only=True)

  class Meta:
    model = models.QuestionPart

class QuestionPartAnswerSerializer(serializers.ModelSerializer):
  grader_name = serializers.CharField(source='grader.user.get_full_name', read_only=True)
  question_part = QuestionPartSerializer(read_only=True)
  points = serializers.FloatField(source='get_points', read_only=True)

  def validate_grader(self, attrs, source):
    """
    Validates the following property: if the grader field is changed, the new
    grader must be the logged in user.
    """
    new_grader = attrs.get(source)
    if (not new_grader == self.object.grader and
        not new_grader.user == self.context.user):
      raise serializers.ValidationError('New grader must be the logged in user.')
    return attrs
  
  def validate_rubrics(self, attrs, source):
    """
    Validates that the given rubrics exist and correspond to the associated
    question part.
    """
    rubrics = attrs.get(source, [])

    for rubric in rubrics:
      # ensure each rubric exists
      if not rubric.question_part == self.object.question_part:
        raise serializers.ValidationError(
          'Invalid rubric for this question part: %d' % rubric.pk)

    return attrs

  class Meta:
    model = models.QuestionPartAnswer
    fields = ('id', 'question_part', 'pages', 'graded', 'grader_comments', 'grader',
      'grader_name', 'rubrics', 'custom_points', 'points')
    read_only_fields = ('id', 'pages')


class RubricSerializer(serializers.ModelSerializer):
  class Meta:
    model = models.Rubric


class UserSerializer(serializers.ModelSerializer):
  class Meta:
    model = models.User
    fields = ('first_name', 'last_name', 'student_id')


class CourseUserSerializer(serializers.ModelSerializer):
  privilege = serializers.CharField(source='get_privilege')
  user = UserSerializer()
  is_current_user = serializers.SerializerMethodField('get_is_current_user')

  def get_is_current_user(self, course_user):
    """ Returns whether or not the course user is the current course user. """
    return course_user == self.context

  class Meta:
    model = models.CourseUser
    fields = ('id', 'privilege', 'user', 'is_current_user')
    read_only_fields = ('id',)
