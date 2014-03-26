from rest_framework import serializers
from scorystapp import models


class ExamSerializer(serializers.ModelSerializer):
  class Meta:
    model = models.Exam
    fields = ('id', 'name')
    read_only_fields = ('id', 'name')


class CourseUserGradedSerializer(serializers.ModelSerializer):
  full_name = serializers.CharField(source='user.get_full_name', read_only=True)
  student_id = serializers.CharField(source='user.student_id', read_only=True)
  email = serializers.CharField(source='user.email', read_only=True)

  is_mapped = serializers.SerializerMethodField('get_is_mapped')
  questions_info = serializers.SerializerMethodField('get_questions_info')

  def get_is_mapped(self, course_user):
    """
    Returns whether or not the course user is mapped to an exam answer for
    the given exam.
    """
    try:
      exam_answer = models.ExamAnswer.objects.get(course_user=course_user,
        exam=self.context['exam'])
      return True
    except models.ExamAnswer.DoesNotExist:
      return False

  def get_questions_info(self, course_user):
    """
    0th index refers to all questions, index i refers to question i
    Returns a list where each element is {'is_graded', 'graders'}
    Returns [] if course user is not mapped to an exam
    """
    questions_info = []

    # Index 0 refers to all questions and we fill it at the end
    questions_info.append({})

    exam = self.context['exam']
    num_questions = exam.get_num_questions()

    try:
      exam_answer = models.ExamAnswer.objects.get(course_user=course_user, exam=exam)
    except models.ExamAnswer.DoesNotExist:
      questions_info = [{
        'is_graded': False,
        'graders': ''
      }]
      return questions_info * (num_questions + 1)

    is_exam_graded = True
    exam_graders = set()

    # loop over each question
    for i in range(num_questions):
      question_part_answers = models.QuestionPartAnswer.objects.filter(
        exam_answer=exam_answer, question_part__question_number=i+1)

      graders = set()
      is_question_graded = True

      # Check if question is graded and find the graders
      for answer in question_part_answers:
        is_question_part_graded = answer.is_graded()
        is_question_graded = is_question_graded and is_question_part_graded
        if is_question_part_graded:
          graders.add(answer.grader.user.get_full_name())

      exam_graders |= graders
      is_exam_graded = is_exam_graded and is_question_graded

      questions_info.append({
        'is_graded': is_question_graded,
        'graders': ', '.join(graders)
      })

    # Now add information about the entire exam
    questions_info[0] = {
      'is_graded': is_exam_graded,
      'graders': ', '.join(exam_graders)
    }
    return questions_info

  class Meta:
    model = models.CourseUser
    fields = ('id', 'full_name', 'student_id', 'email', 'is_mapped', 'questions_info')
    read_only_fields = ('id', )
