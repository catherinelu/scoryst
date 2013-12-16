from django import template
import re

register = template.Library()

@register.simple_tag
def path_active(path, pattern):
  """ Returns 'active' if the path matches the given pattern, or '' otherwise. """
  if re.search(pattern, path):
    return 'active'
  return ''
