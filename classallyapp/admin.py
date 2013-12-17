from django.contrib import admin
from classallyapp.models import User
from classallyapp.models import CourseUser
from classallyapp.models import Course
from classallyapp.models import Exam
from classallyapp.models import Question
from classallyapp.models import Rubric
from classallyapp.models import ExamAnswer
from classallyapp.models import QuestionAnswer
from classallyapp.models import GradedRubric

admin.site.register(User)
admin.site.register(CourseUser)
admin.site.register(Course)
admin.site.register(Exam)
admin.site.register(Question)
admin.site.register(Rubric)
admin.site.register(ExamAnswer)
admin.site.register(QuestionAnswer)
admin.site.register(GradedRubric)
