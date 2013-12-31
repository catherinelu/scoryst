from rest_framework import serializers
from scorystapp import models

class QuestionPartSerializer(serializers.ModelSerializer):
  class Meta:
    model = models.QuestionPart

class QuestionPartAnswerSerializer(serializers.ModelSerializer):
  class Meta:
    model = models.QuestionPartAnswer

class RubricSerializer(serializers.ModelSerializer):
  class Meta:
    model = models.Rubric
