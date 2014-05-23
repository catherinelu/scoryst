from johnny import cache as johnny_cache
from django.core.cache import cache as django_cache
import json
import base64


def cache_on_models(*models):
  """
  Returns a decorator that allows a function to be cached on the given set of
  models. If any of the models is invalidated (i.e. it's generation key
  changes), the decorated function will be re-run and re-cached.
  """
  backend = johnny_cache.get_backend()
  table_names = map(lambda model: model._meta.db_table, models)
  print 'table names are', table_names

  def _cache_on_tables_decorator(fn):
    multi_generation_key = backend.keyhandler.get_generation(*table_names)
    fn_key = '%s.%s' % (fn.__module__, fn.__name__)

    def _fn_with_caching(*args, **kwargs):
      """ Wraps the given function, fn, with caching. """
      key_parts = [multi_generation_key, fn_key, args, kwargs]
      key = json.dumps(key_parts)

      key = base64.b64encode(key)
      value = django_cache.get(key)

      if value == None:
        value = fn(*args, **kwargs)
        # pass timeout of 0 to cache forever
        django_cache.set(key, value, 0)

      return value
    return _fn_with_caching
  return _cache_on_tables_decorator
