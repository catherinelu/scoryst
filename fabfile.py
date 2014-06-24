from fabric.api import *
from fabric.contrib.console import confirm

env.use_ssh_config = True
env.hosts = ['scoryst']


def deploy(reference='origin/master'):
  """ Deploys the given reference to the scoryst server. """
  reset = 'git reset --hard %s' % reference
  apps = ['scorystapp']

  with cd(_get_scoryst_dir()):
    run('git fetch origin')
    if confirm('Going to run %s. Proceed?' % reset):
      run(reset)
      run('source venv/bin/activate && pip install -r requirements.txt')
      run('supervisorctl restart scoryst')

    if confirm('Migrate all databases?'):
      for app in apps:
        run('source venv/bin/activate && python manage.py migrate ' + app)

    if confirm('Restart celery?'):
      run('supervisorctl restart scoryst-celery-worker')


def _get_scoryst_dir():
  """ Returns the directory of the remote scoryst django project. """
  return '/home/deploy/scoryst'
