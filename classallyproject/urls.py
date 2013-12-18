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
    url(r'^$', 'classallyapp.views.login'),
    url(r'^logout/$', 'classallyapp.views.logout'),
    url(r'^new-course/$', 'classallyapp.views.new_course'),

    # course roster
    url(r'^course/(?P<course_id>\d+)/roster/$', 'classallyapp.views.roster'),
    url(r'^course/(?P<course_id>\d+)/roster/delete/(?P<course_user_id>\d+)/$',
      'classallyapp.views.delete_from_roster'),

    # course exam
    url(r'^course/(?P<course_id>\d+)/upload-exam/$', 'classallyapp.views.upload_exam'),
    url(r'^course/(?P<course_id>\d+)/create-exam/(?P<exam_id>\d+)/$', 'classallyapp.views.create_exam'),
    url(r'^course/(?P<course_id>\d+)/create-exam/(?P<exam_id>\d+)/ajax-get-empty-exam-url/$',
        'classallyapp.views.ajax_get_empty_exam_url'),
    url(r'^course/(?P<course_id>\d+)/create-exam/(?P<exam_id>\d+)/ajax-recreate-exam/$',
        'classallyapp.views.ajax_recreate_exam'),

    # course grading
    # TODO: line length
    url(r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/$', 'classallyapp.views.grade'),
    url(r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/ajax_get_rubrics/(?P<question_number>\d+)/(?P<part_number>\d+)$',
        'classallyapp.views.ajax_get_rubrics'),
    url(r'^course/(?P<course_id>\d+)/grade/(?P<exam_answer_id>\d+)/ajax_get_exam_summary/(?P<question_number>\d+)/(?P<part_number>\d+)$',
        'classallyapp.views.ajax_get_exam_summary'),

    # redirect for login_required decorator; TODO: make custom decorator for this
    url(r'^accounts/login/$', 'classallyapp.views.redirect_to_login'),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
    # Next line enables the admin:
    url(r'^admin/', include(admin.site.urls)),
)
