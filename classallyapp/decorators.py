from classallyapp import models
from django import shortcuts
from django import http

# TODO: rename to valid_course_user_required
def valid_course_required(fn):
  """ Returns the function below: """
  def validate_course(request, course_id, *args, **kwargs):
    """
    Validates that the given course ID is valid. Calls fn if so. Otherwise,
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
    Validates that the given course user is an instructor. Calls fn if so.
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
