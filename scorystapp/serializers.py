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

  class Meta:
    model = models.QuestionPartAnswer
    fields = ('id', 'question_part', 'pages', 'graded', 'grader_comments', 'grader',
      'grader_name', 'rubrics', 'custom_points', 'points')
    read_only_fields = ('id', 'pages')

class RubricSerializer(serializers.ModelSerializer):
  class Meta:
    model = models.Rubric
