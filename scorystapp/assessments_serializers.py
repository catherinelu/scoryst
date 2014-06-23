import pytz
from rest_framework import serializers
from scorystapp import models


class AssessmentSerializer(serializers.ModelSerializer):
  is_exam = serializers.SerializerMethodField('get_is_exam')
  solutions_pdf = serializers.SerializerMethodField('get_solutions_pdf')
  can_edit = serializers.SerializerMethodField('get_can_edit')

  # Only valid if the assessment is an exam (else None)
  page_count = serializers.SerializerMethodField('get_page_count')
  exam_pdf = serializers.SerializerMethodField('get_exam_pdf')

  # Only valid is the assessment is a homework (else None)
  submission_deadline = serializers.SerializerMethodField('get_submission_deadline')

  def get_is_exam(self, assessment):
    return hasattr(assessment, 'exam')

  def get_page_count(self, assessment):
    if self.get_is_exam(assessment):
      return assessment.exam.page_count
    return None

  def get_solutions_pdf(self, assessment):
    try:
      return assessment.solutions_pdf.url if assessment.solutions_pdf else None
    except:
      return None

  def get_exam_pdf(self, assessment):
    if self.get_is_exam(assessment):
      # It's possible that the exam PDF is not yet uploaded when trying to get this
      try:
        return assessment.exam.exam_pdf.url
      except:
        return None
    return None

  def get_submission_deadline(self, assessment):
    if hasattr(assessment, 'homework'):
      tz = pytz.timezone('US/Pacific')
      return assessment.homework.submission_deadline.astimezone(tz).strftime('%m/%d/%Y %H:%M')
    return None

  def get_can_edit(self, assessment):
    return models.Submission.objects.filter(assessment=assessment).count() == 0

  class Meta:
    model = models.Assessment
    fields = ('id', 'name', 'course', 'is_exam', 'page_count', 'solutions_pdf',
              'submission_deadline', 'exam_pdf', 'can_edit', 'grade_down')
    read_only_fields = ('id', 'name', 'course')


class CourseUserSerializer(serializers.ModelSerializer):
  name = serializers.CharField(source='user.get_full_name', read_only=True)
  student_id = serializers.CharField(source='user.student_id', read_only=True)
  email = serializers.CharField(source='user.email', read_only=True)

  is_assigned = serializers.SerializerMethodField('get_is_assigned')
  tokens = serializers.SerializerMethodField('get_tokens')

  def get_is_assigned(self, course_user):
    """ Returns whether or not the course user is assigned to an exam answer. """
    exam_answer = models.Submission.objects.filter(course_user=course_user,
      exam=self.context['exam'])
    return bool(exam_answer)

  def get_tokens(self, course_user):
    """ Returns tokens used to search by typeahead. """
    return [course_user.user.first_name, course_user.user.last_name]

  class Meta:
    model = models.CourseUser
    fields = ('id', 'is_assigned', 'name', 'student_id', 'email', 'tokens')
    read_only_fields = ('id',)


class QuestionPartSerializer(serializers.ModelSerializer):
  def validate_assessment(self, attrs, source):
    """ Validates that the QuestionPart matches the one currently being viewed. """
    assessment = attrs.get(source)

    if not assessment == self.context['assessment']:
      raise serializers.ValidationError(
          'Rubric for invalid assessment: %d' % assessment.pk)
    return attrs

  class Meta:
    model = models.QuestionPart
    fields = ('id', 'assessment', 'question_number', 'part_number', 'max_points', 'pages')
    read_only_fields = ('id',)
