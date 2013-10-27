from django.conf.urls import patterns, include, url

# The next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    url(r'^$', 'classallyapp.views.index', name='index'),
    # url(r'^classallyproject/', include('classallyproject.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Next line enables the admin:
    url(r'^admin/', include(admin.site.urls)),
    url(r'^userform/', 'classallyapp.views.userform', name='userform')
)
