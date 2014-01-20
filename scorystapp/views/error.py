from scorystapp.views import helpers
from scorystapp import decorators

@decorators.login_required
def error404(request):
  """ Returns a 404 page """
  return helpers.render(request, '404.epy', {
    'title': 'Page Not Found'
  })

@decorators.login_required
def error500(request):
  """ Returns a 500 page """
  return helpers.render(request, '500.epy', {
    'title': 'Internal Server Error'
  })
