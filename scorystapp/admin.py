from django.contrib import admin
from scorystapp import models

admin.site.register(models.User)
admin.site.register(models.CourseUser)
admin.site.register(models.Course)
admin.site.register(models.Exam)
admin.site.register(models.ExamPage)
admin.site.register(models.QuestionPart)
admin.site.register(models.Rubric)
admin.site.register(models.ExamAnswer)
admin.site.register(models.ExamAnswerPage)
admin.site.register(models.QuestionPartAnswer)
