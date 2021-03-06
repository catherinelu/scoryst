from rest_framework import serializers
from scorystapp import models


class CourseUserSerializer(serializers.ModelSerializer):
  name = serializers.CharField(source='user.get_full_name', read_only=True)
  student_id = serializers.CharField(source='user.student_id', read_only=True)
  email = serializers.CharField(source='user.email', read_only=True)

  is_assigned = serializers.SerializerMethodField('get_is_assigned')
  tokens = serializers.SerializerMethodField('get_tokens')

  def get_is_assigned(self, course_user):
    """ Returns whether or not the course user is assigned to an exam answer. """
    submission = models.Submission.objects.filter(course_user=course_user,
      assessment=self.context['exam'])
    return submission.count() > 0

  def get_tokens(self, course_user):
    """ Returns tokens used to search by typeahead. """
    return [course_user.user.first_name, course_user.user.last_name]

  class Meta:
    model = models.CourseUser
    fields = ('id', 'is_assigned', 'name', 'student_id', 'email', 'tokens')
    read_only_fields = ('id',)


class SubmissionSerializer(serializers.ModelSerializer):
  name = serializers.CharField(source='course_user.user.get_full_name', read_only=True)
  course_user = serializers.PrimaryKeyRelatedField(required=False, source='course_user')

  def validate(self, attrs):
    """ Sets group_members field to the course_user. """
    course_user = attrs.get('course_user')
    if course_user:
      attrs['group_members'] = [course_user.id]
    else:
      attrs['group_members'] = []
    return attrs

  def validate_course_user(self, attrs, source):
    """
    Validates that the course_user is a student associated with the course_user
    the submission belongs to.
    """
    course_user = attrs.get(source)
    exam = self.context['exam']

    if course_user and (course_user.course != exam.course or
        course_user.privilege != models.CourseUser.STUDENT):
      raise serializers.ValidationError(
        'Invalid course user %s for course %s' % (course_user.pk, exam.course.name))
    return attrs

  class Meta:
    model = models.Submission
    fields = ('id', 'course_user', 'name', 'group_members')
    read_only_fields = ('id',)
