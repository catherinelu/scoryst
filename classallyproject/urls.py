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
  url(r'^login/$', 'classallyapp.views.auth.login', { 'redirect_path': 'new-course' }),
  url(r'^login/redirect/(?P<redirect_path>.*?)$', 'classallyapp.views.auth.login'),
  url(r'^logout/$', 'classallyapp.views.auth.logout'),
  url(r'^new-course/$', 'classallyapp.views.course.new_course'),

  # course roster
  # TODO: naming of views now that we have separate files; e.g. roster.delete
  # instead of roster.delete_from_roster
  url(r'^course/(?P<course_id>\d+)/roster/$', 'classallyapp.views.roster.roster'),
  url(r'^course/(?P<course_id>\d+)/roster/delete/(?P<course_user_id>\d+)/$',
    'classallyapp.views.roster.delete_from_roster'),

  # exam mapping
  url(r'^course/(?P<course_id>\d+)/map-exams/(?P<exam_id>\d+)/$',
    'classallyapp.views.exams.map_exams'),
  url(r'^course/(?P<course_id>\d+)/map-exams/(?P<exam_id>\d+)/students-info$',
    'classallyapp.views.exams.students_info'),

  # course exam
  url(r'^course/(?P<course_id>\d+)/exams/$', 'classallyapp.views.exams.exams'),
  url(r'^course/(?P<course_id>\d+)/exams/delete/(?P<exam_id>\d+)/$',
    'classallyapp.views.exams.delete_exam'),
  url(r'^course/(?P<course_id>\d+)/create-exam/(?P<exam_id>\d+)/$',
    'classallyapp.views.exams.create_exam'),
  # TODO: inconsistent URL/view naming generally
  url(r'^course/(?P<course_id>\d+)/create-exam/(?P<exam_id>\d+)/get-exam-jpeg/(?P<page_number>\d+)$',
    'classallyapp.views.exams.get_empty_exam_jpeg'),
  url(r'^course/(?P<course_id>\d+)/create-exam/(?P<exam_id>\d+)/get-page-count/$',
    'classallyapp.views.exams.get_empty_exam_page_count'),
  url(r'^course/(?P<course_id>\d+)/create-exam/(?P<exam_id>\d+)/recreate-exam/$',
    'classallyapp.views.exams.recreate_exam'),

  # course grading overview
  # For instructors
  url(r'^course/(?P<course_id>\d+)/grade/$', 'classallyapp.views.overview.grade_overview'),
  # For students
  url(r'^course/(?P<course_id>\d+)/view-exam/$',
    'classallyapp.views.overview.student_grade_overview'),
  # Both
  url(r'^course/(?P<course_id>\d+)/(grade|view-exam)/get-user-exam-summary/(?P<user_id>\d+)/(?P<exam_id>\d+)/$',
    'classallyapp.views.overview.get_user_exam_summary'),

  # course grading
  url(r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/$',
    'classallyapp.views.grade.grade'),
  url(r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/modify-custom-rubric/$',
    'classallyapp.views.grade.modify_custom_rubric'),
  url(r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/save-graded-rubric/$',
    'classallyapp.views.grade.save_graded_rubric'),
  url(r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/save-comment/$',
    'classallyapp.views.grade.save_comment'),
  url(r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/get-previous-student/$',
   'classallyapp.views.grade.get_previous_student'),
  url(r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/get-next-student/$',
    'classallyapp.views.grade.get_next_student'),

  url((r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/get-previous-student-jpeg/'
    '(?P<question_number>\d+)/(?P<part_number>\d+)$'),
    'classallyapp.views.grade.get_previous_student_jpeg'),
  url((r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/get-next-student-jpeg/'
    '(?P<question_number>\d+)/(?P<part_number>\d+)$'),
    'classallyapp.views.grade.get_next_student_jpeg'),

  # course student view exam
  url(r'^course/(?P<course_id>\d+)/view-exam/(?P<exam_answer_id>\d+)/$',
    'classallyapp.views.view.view_exam'),

  # create preview exam
  url(r'^course/(?P<course_id>\d+)/preview-exam/(?P<exam_answer_id>\d+)/$',
    'classallyapp.views.view.preview_exam'),
  url(r'^course/(?P<course_id>\d+)/preview-exam/(?P<exam_answer_id>\d+)/edit$',
    'classallyapp.views.view.edit_created_exam'),
  url(r'^course/(?P<course_id>\d+)/preview-exam/(?P<exam_answer_id>\d+)/save$',
    'classallyapp.views.view.save_created_exam'),

  # course grading or student view exam or preview exam
  url((r'^course/(?P<course_id>\d+)/(grade|view-exam|preview-exam)/(?P<exam_answer_id>\d+)/get-rubrics/'
    '(?P<question_number>\d+)/(?P<part_number>\d+)$'),
    'classallyapp.views.grade_or_view.get_rubrics'),
  url((r'^course/(?P<course_id>\d+)/(grade|view-exam|preview-exam)/(?P<exam_answer_id>\d+)/get-exam-summary/'
    '(?P<question_number>\d+)/(?P<part_number>\d+)$'),
    'classallyapp.views.grade_or_view.get_exam_summary'),

  url(r'^course/(?P<course_id>\d+)/(grade|view-exam|preview-exam)/(?P<exam_answer_id>\d+)/get-exam-page-mappings/',
    'classallyapp.views.grade_or_view.get_exam_page_mappings'),
  url(r'^course/(?P<course_id>\d+)/(grade|view-exam|preview-exam)/(?P<exam_answer_id>\d+)/get-exam-jpeg/(?P<page_number>\d+)$',
    'classallyapp.views.grade_or_view.get_exam_jpeg'),

  # TODO: inconsistent; url should be get-exam-page-count
  url(r'^course/(?P<course_id>\d+)/(grade|view-exam|preview-exam)/(?P<exam_answer_id>\d+)/get-page-count/$',
    'classallyapp.views.grade_or_view.get_exam_page_count'),
  url(r'^course/(?P<course_id>\d+)/(grade|view-exam|preview-exam)/(?P<exam_answer_id>\d+)/exam-solutions-pdf/$',
    'classallyapp.views.grade_or_view.get_exam_solutions_pdf'),
  url(r'^course/(?P<course_id>\d+)/(grade|view-exam|preview-exam)/(?P<exam_answer_id>\d+)/exam-pdf/$',
    'classallyapp.views.grade_or_view.get_exam_pdf'),

  # Reseting password
  url(r'^reset-password/password-sent/$', 'django.contrib.auth.views.password_reset_done',
    {'template_name': 'reset/password_reset_done.epy'}),
  url(r'^reset-password/$', 'django.contrib.auth.views.password_reset',
    {'template_name': 'reset/password_reset_form.epy',
    'email_template_name': 'reset/password_reset_email.epy'
    }
  ),
  url(r'^reset/(?P<uidb36>[0-9A-Za-z]+)-(?P<token>.+)/$',
    'django.contrib.auth.views.password_reset_confirm',
    {'template_name': 'reset/password_reset_confirm.epy'}),
  url(r'^reset/done/$', 'django.contrib.auth.views.password_reset_complete',
    {'template_name': 'reset/password_reset_complete.epy'}),

  url(r'^accounts/password-change/$', 'django.contrib.auth.views.password_change',
    {'template_name': 'reset/password_change_form.epy'}),
  url(r'^accounts/password-change/done$', 'django.contrib.auth.views.password_change_done',
    {'template_name': 'reset/password_change_done.epy'}),

  # Uncomment the admin/doc line below to enable admin documentation:
  # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
  # Next line enables the admin:
  url(r'^admin/', include(admin.site.urls)),
)
