from classallyapp import models
from django import shortcuts
from django import http

def valid_course_user_required(fn):
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

    Should be chained with @valid_course_user_required (defined above), like so:

      @valid_course_user_required
      @instructor_required
      def view_fn():
        ...
    """
    if not course_user.privilege == models.CourseUser.INSTRUCTOR:
      raise http.Http404('Must be an instructor.')
    return fn(request, course_user, *args, **kwargs)

  return validate_instructor


def instructor_or_ta_required(fn):
  def validate_instructor_or_ta(request, course_user, *args, **kwargs):
    """
    Validates that the given course user is an instructor or TA. If so, calls fn.
    Otherwise, renders a 404 page.

    Should be chained with @valid_course_user_required (defined above), like so:

      @valid_course_user_required
      @instructor_or_ta_required
      def view_fn():
        ...
    """
    if (course_user.privilege != models.CourseUser.INSTRUCTOR and
        course_user.privilege != models.CourseUser.TA):
      raise http.Http404('Must be an instructor or a TA.')
    return fn(request, course_user, *args, **kwargs)

  return validate_instructor_or_ta


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


def student_required(fn):
  """ Returns the function below: """
  def validate_student(request, course_user, exam_answer_id, *args, **kwargs):
    """
    Validates that the current course user matches the user that the exam answer
    belongs to, or that the current course user is an instructor/TA.
    """
    if (course_user.privilege != models.CourseUser.INSTRUCTOR and
        course_user.privilege != models.CourseUser.TA):
      exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
      if exam_answer.course_user != course_user:
        raise http.Http404('This exam doesn\'t seem to belong to you.')
    return fn(request, course_user, exam_answer_id, *args, **kwargs)

  return validate_student


def instructor_for_any_course_required(fn):
    """ Returns the function below: """
    def validate_instructor_for_any_course(request, *args, **kwargs):
      """
      Validates that the given course user is an instructor for at least one
      other course. If so, calls fn.
      Otherwise, renders a 404 page.
      """
      num_course_users = models.CourseUser.objects.filter(user=request.user,
        privilege=models.CourseUser.INSTRUCTOR).count()
      if num_course_users == 0:
        raise http.Http404('Only valid instructors can create a new course.')
      return fn(request, *args, **kwargs)

    return validate_instructor_for_any_course