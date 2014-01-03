from rest_framework import serializers
from scorystapp import models

class QuestionPartSerializer(serializers.ModelSerializer):
  grade_down = serializers.BooleanField(source='is_exam_graded_down', read_only=True)

  class Meta:
    model = models.QuestionPart

class QuestionPartAnswerSerializer(serializers.ModelSerializer):
  class Meta:
    model = models.QuestionPartAnswer

class RubricSerializer(serializers.ModelSerializer):
  class Meta:
    model = models.Rubric
