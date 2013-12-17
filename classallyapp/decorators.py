from classallyapp import models
from django import shortcuts

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
