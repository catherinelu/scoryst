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

    # TODO: reinstate once we add south
    # if confirm('Migrate all databases?'):
    #   run('./manage.py syncdb')
    #   for app in apps:
    #     run('./manage.py migrate ' + app)


def _get_scoryst_dir():
  """ Returns the directory of the remote scoryst django project. """
  return '/home/deploy/scoryst'
