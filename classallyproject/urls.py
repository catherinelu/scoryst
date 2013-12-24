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
  url(r'^course/(?P<course_id>\d+)/create-exam/(?P<exam_id>\d+)/get-exam-jpeg/(?P<page_number>\d+)$',
    'classallyapp.views.get_empty_exam_jpeg'),
  url(r'^course/(?P<course_id>\d+)/create-exam/(?P<exam_id>\d+)/get-page-count/$',
    'classallyapp.views.get_empty_exam_page_count'),
  url(r'^course/(?P<course_id>\d+)/create-exam/(?P<exam_id>\d+)/recreate-exam/$',
    'classallyapp.views.recreate_exam'),

  # course grading overview
  url(r'^course/(?P<course_id>\d+)/grade/$', 'classallyapp.views.grade_overview'),
  url(r'^course/(?P<course_id>\d+)/grade/(?P<user_id>\d+)/get-exam-summary/\d*$',
    'classallyapp.views.get_exam_summary'),

  # course grading
  url(r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/$',
    'classallyapp.views.grade'),
  url(r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/modify-custom-rubric/$',
    'classallyapp.views.modify_custom_rubric'),
  url(r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/save-graded-rubric/$',
    'classallyapp.views.save_graded_rubric'),
  url(r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/save-comment/$',
    'classallyapp.views.save_comment'),
  url(r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/get-previous-student/$',
   'classallyapp.views.get_previous_student'),
  url(r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/get-next-student/$',
    'classallyapp.views.get_next_student'),
  url((r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/get-previous-student-jpeg/'
    '(?P<question_number>\d+)/(?P<part_number>\d+)$'), 'classallyapp.views.get_previous_student_jpeg'),
  url((r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/get-next-student-jpeg/'
    '(?P<question_number>\d+)/(?P<part_number>\d+)$'), 'classallyapp.views.get_next_student_jpeg'),


  # course student view exam
  url(r'^course/(?P<course_id>\d+)/view-exam/(?P<exam_answer_id>\d+)/$',
    'classallyapp.views.view_exam'),

  # course grading or student view exam
  url((r'^course/(?P<course_id>\d+)/(grade|view-exam)/(?P<exam_answer_id>\d+)/get-rubrics/'
    '(?P<question_number>\d+)/(?P<part_number>\d+)$'), 'classallyapp.views.get_rubrics'),
  url((r'^course/(?P<course_id>\d+)/(grade|view-exam)/(?P<exam_answer_id>\d+)/get-exam-summary/'
    '(?P<question_number>\d+)/(?P<part_number>\d+)$'), 'classallyapp.views.get_exam_summary'),
  url(r'^course/(?P<course_id>\d+)/(grade|view-exam)/(?P<exam_answer_id>\d+)/get-exam-page-mappings/',
    'classallyapp.views.get_exam_page_mappings'),
  url(r'^course/(?P<course_id>\d+)/(grade|view-exam)/(?P<exam_answer_id>\d+)/get-exam-jpeg/(?P<page_number>\d+)$',
    'classallyapp.views.get_exam_jpeg'),
  url(r'^course/(?P<course_id>\d+)/(grade|view-exam)/(?P<exam_answer_id>\d+)/get-page-count/$',
    'classallyapp.views.get_exam_page_count'),

  # Uncomment the admin/doc line below to enable admin documentation:
  # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
  # Next line enables the admin:
  url(r'^admin/', include(admin.site.urls)),
)
