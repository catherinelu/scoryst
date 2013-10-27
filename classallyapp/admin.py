from django.contrib import admin
from classallyapp.models import User
from classallyapp.models import ClassUser
from classallyapp.models import Class
from classallyapp.models import Test
from classallyapp.models import Question
from classallyapp.models import Rubric
from classallyapp.models import TestAnswer
from classallyapp.models import QuestionAnswer
from classallyapp.models import GradedRubric

admin.site.register(User)
admin.site.register(ClassUser)
admin.site.register(Class)
admin.site.register(Test)
admin.site.register(Question)
admin.site.register(Rubric)
admin.site.register(TestAnswer)
admin.site.register(QuestionAnswer)
admin.site.register(GradedRubric)
