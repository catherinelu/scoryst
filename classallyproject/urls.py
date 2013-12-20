from django.core.urlresolvers import reverse_lazy
from django.conf import settings
from django.conf.urls import patterns, include, url
from django.conf.urls.static import static
from django.views.generic import RedirectView
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

# The next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
  url(r'^login/$', 'classallyapp.views.login', { 'redirect_path': 'new-course' }),
  url(r'^login/redirect/(?P<redirect_path>.*?)$', 'classallyapp.views.login'),
  url(r'^logout/$', 'classallyapp.views.logout'),
  url(r'^new-course/$', 'classallyapp.views.new_course'),

  # course roster
  url(r'^course/(?P<course_id>\d+)/roster/$', 'classallyapp.views.roster'),
  url(r'^course/(?P<course_id>\d+)/roster/delete/(?P<course_user_id>\d+)/$',
    'classallyapp.views.delete_from_roster'),

  # exam mapping
  url(r'^course/(?P<course_id>\d+)/map-exams/(?P<exam_id>\d+)/$', 'classallyapp.views.map_exams'),
  url(r'^course/(?P<course_id>\d+)/map-exams/(?P<exam_id>\d+)/students-info$',
    'classallyapp.views.students_info'),

  # course exam
  url(r'^course/(?P<course_id>\d+)/upload-exam/$', 'classallyapp.views.upload_exam'),
  url(r'^course/(?P<course_id>\d+)/create-exam/(?P<exam_id>\d+)/$', 'classallyapp.views.create_exam'),
  url(r'^course/(?P<course_id>\d+)/create-exam/(?P<exam_id>\d+)/get-empty-exam/$',
    'classallyapp.views.get_empty_exam'),
  url(r'^course/(?P<course_id>\d+)/create-exam/(?P<exam_id>\d+)/recreate-exam/$',
    'classallyapp.views.recreate_exam'),

  # course grading
  url(r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/$',
    'classallyapp.views.grade'),
  url((r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/get-rubrics/'
    '(?P<question_number>\d+)/(?P<part_number>\d+)$'), 'classallyapp.views.get_rubrics'),
  url((r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/get-exam-summary/'
    '(?P<question_number>\d+)/(?P<part_number>\d+)$'), 'classallyapp.views.get_exam_summary'),
  url((r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/save-graded-rubric/'
    '(?P<question_number>\d+)/(?P<part_number>\d+)/(?P<rubric_id>\d+)/(?P<add_or_delete>\w+)'),
    'classallyapp.views.save_graded_rubric'),
  url((r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/save-comment/'
    '(?P<question_number>\d+)/(?P<part_number>\d+)$'), 'classallyapp.views.save_comment'),
  url((r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/previous-student/'
    '(?P<question_number>\d+)/(?P<part_number>\d+)$'), 'classallyapp.views.previous_student'),
  url((r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/next-student/'
    '(?P<question_number>\d+)/(?P<part_number>\d+)$'), 'classallyapp.views.next_student'),

  # Uncomment the admin/doc line below to enable admin documentation:
  # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
  # Next line enables the admin:
  url(r'^admin/', include(admin.site.urls)),
)
