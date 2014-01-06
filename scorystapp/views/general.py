from scorystapp.views import helpers
from django import shortcuts

def about(request):
  return helpers.render(request, 'about.epy', {
    'title': 'About',
  })

def landing_page(request):
  # TODO: remove later
  return shortcuts.redirect('/login')
  return shortcuts.render(request, 'landing-page.epy')
