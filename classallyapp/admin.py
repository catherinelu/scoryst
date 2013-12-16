from django.contrib import admin
from classallyapp.models import User
from classallyapp.models import ClassUser
from classallyapp.models import Class
from classallyapp.models import Exam
from classallyapp.models import Question
from classallyapp.models import Rubric
from classallyapp.models import ExamAnswer
from classallyapp.models import QuestionAnswer
from classallyapp.models import GradedRubric

admin.site.register(User)
admin.site.register(ClassUser)
admin.site.register(Class)
admin.site.register(Exam)
admin.site.register(Question)
admin.site.register(Rubric)
admin.site.register(ExamAnswer)
admin.site.register(QuestionAnswer)
admin.site.register(GradedRubric)
