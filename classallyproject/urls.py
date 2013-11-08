from django.core.urlresolvers import reverse_lazy
from django.conf.urls import patterns, include, url
from django.views.generic import RedirectView

# The next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    url(r'^$', 'classallyapp.views.index'),
    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
    # Next line enables the admin:
    url(r'^admin/', include(admin.site.urls)),
    url(r'^grade/$', 'classallyapp.views.grade'),
    # TODO: Add in other characters in case they are part of the ID
    url(r'^grade/(?P<username>[a-zA-z0-9]|.|_|-)*/$', 'classallyapp.views.grade_exam'),
    url(r'^accounts/login/$', 'classallyapp.views.redirect_to_login'),
)