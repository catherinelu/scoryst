from django.core.urlresolvers import reverse_lazy
from django.conf import settings
from django.conf.urls import patterns, include, url
from django.conf.urls.static import static
from django.views.generic import RedirectView

# The next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    url(r'^$', 'classallyapp.views.login'),
    url(r'^logout/$', 'classallyapp.views.logout'),
    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
    # Next line enables the admin:
    url(r'^admin/', include(admin.site.urls)),
    url(r'^dashboard/$', 'classallyapp.views.dashboard'),
    url(r'^grade/(?P<exam_answer_id>\d+)/$', 'classallyapp.views.grade'),
    url(r'^grade/(?P<exam_answer_id>\d+)/ajax_get_rubrics/(?P<question_number>\d+)/(?P<part_number>\d+)$',
        'classallyapp.views.ajax_get_rubrics'),
    url(r'^grade/(?P<exam_answer_id>\d+)/ajax_get_exam_summary/(?P<question_number>\d+)/(?P<part_number>\d+)$',
        'classallyapp.views.ajax_get_exam_summary'),
    url(r'^accounts/login/$', 'classallyapp.views.redirect_to_login'),
    url(r'^upload-exam/(?P<course_id>[a-zA-z0-9]|.|_|-)*/$', 'classallyapp.views.upload_exam'),
    url(r'^create-exam/(?P<exam_id>[a-zA-z0-9]|.|_|-)*/$', 'classallyapp.views.create_exam'),
)

# serve static files for development
if settings.DEBUG:
    urlpatterns += static('/static/', document_root=settings.STATIC_DOC_ROOT)
