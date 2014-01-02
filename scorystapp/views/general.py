from scorystapp.views import helpers
from django import shortcuts

def about(request):
  return helpers.render(request, 'about.epy', {
    'title': 'About',
  })

def landing_page(request):
  return shortcuts.render(request, 'landing-page.epy')