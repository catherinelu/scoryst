from classallyapp.views import helpers

def about(request):
  return helpers.render(request, 'about.epy', {
    'title': 'About',
  })