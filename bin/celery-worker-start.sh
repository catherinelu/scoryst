#!/bin/bash
 
NAME="scoryst-celery"                             # Name of the application
DJANGODIR=/home/deploy/scoryst                    # Django project directory
USER=deploy                                       # the user to run as
DJANGO_SETTINGS_MODULE=scorystproject.settings    # which settings file should Django use
DJANGO_WSGI_MODULE=scorystproject.wsgi            # WSGI module name
 
echo "Starting $NAME as `whoami`"
 
# Activate the virtual environment
cd $DJANGODIR
export DJANGO_SETTINGS_MODULE=$DJANGO_SETTINGS_MODULE
export PYTHONPATH=$DJANGODIR:$PYTHONPATH
 
# Start celery daemon
exec su -s /bin/bash -c 'source venv/bin/activate && python manage.py celeryd' $USER
