from classallyapp import models
from django import shortcuts
from django import http

# TODO: rename to valid_course_user_required
def valid_course_required(fn):
  """ Returns the function below: """
  def validate_course(request, course_id, *args, **kwargs):
    """
    Validates that the given course ID is valid. If so, calls fn. Otherwise,
    renders a 404 page.
    """
    course_user = shortcuts.get_object_or_404(models.CourseUser,
      user=request.user.pk, course=course_id)
    return fn(request, course_user, *args, **kwargs)

  return validate_course


def instructor_required(fn):
  """ Returns the function below: """
  def validate_instructor(request, course_user, *args, **kwargs):
    """
    Validates that the given course user is an instructor. If so, calls fn.
    Otherwise, renders a 404 page.

    Should be chained with @valid_course_required (defined above), like so:

      @valid_course_required
      @instructor_required
      def view_fn():
        ...
    """
    if not course_user.privilege == models.CourseUser.INSTRUCTOR:
      raise http.Http404('Must be an instructor.')
    return fn(request, course_user, *args, **kwargs)

  return validate_instructor


def login_required(fn):
  """ Returns the function below: """
  def validate_logged_in(request, *args, **kwargs):
    """
    Validates that the user is logged in. If so, calls fn. Otherwise, redirects
    to login page.
    """
    if not request.user.is_authenticated():
      return shortcuts.redirect('/login/redirect%s' % request.path)
    return fn(request, *args, **kwargs)

  return validate_logged_in
