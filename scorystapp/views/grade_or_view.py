import base64, imghdr
from django import shortcuts, http
from django.conf import settings
from django.core.files import base, storage
from scorystapp import models, decorators, serializers
import json, requests
from rest_framework import decorators as rest_decorators, response as rest_framework_response


@decorators.access_controlled
@decorators.student_required
@decorators.submission_released_required
def get_assessment_solutions_pdf(request, cur_course_user, submission_id):
  submission = shortcuts.get_object_or_404(models.Submission, pk=submission_id)
  return shortcuts.redirect(submission.assessment.solutions_pdf.url)


@decorators.access_controlled
@decorators.student_required
@decorators.submission_released_required
def get_assessment_pdf(request, cur_course_user, submission_id):
  submission = shortcuts.get_object_or_404(models.Submission, pk=submission_id)
  return shortcuts.redirect(submission.pdf.url)


@decorators.access_controlled
@decorators.student_required
@decorators.submission_released_required
def get_non_blank_pages(request, cur_course_user, submission_id, assessment_id=None):
  submission_pages = models.SubmissionPage.objects.filter(submission=submission_id)
  pages = sorted([page.page_number for page in submission_pages if not page.is_blank])
  return http.HttpResponse(json.dumps(pages), mimetype='application/json')


# TODO: confirm security is OK for the API methods below
@rest_decorators.api_view(['GET'])
@decorators.access_controlled
@decorators.student_required
@decorators.submission_released_required
def list_responses(request, cur_course_user, submission_id):
  """ Returns a list of responses for the provided asessment. """
  responses = models.Response.objects.filter(
    submission=submission_id).order_by('question_part__question_number',
    'question_part__part_number')
  serializer = serializers.ResponseSerializer(responses,
    many=True)

  return rest_framework_response.Response(serializer.data)


@rest_decorators.api_view(['GET', 'PUT'])
@decorators.access_controlled
@decorators.student_required
@decorators.submission_released_required
def manage_response(request, cur_course_user, submission_id,
    response_id):
  """ Manages a single Response by allowing reads/updates. """
  response = shortcuts.get_object_or_404(models.Response,
    pk=response_id)

  if request.method == 'GET':
    serializer = serializers.ResponseSerializer(response)
    return rest_framework_response.Response(serializer.data)
  elif request.method == 'PUT':
    # user must be an instructor/TA
    if cur_course_user.privilege == models.CourseUser.STUDENT:
      return rest_framework_response.Response(status=403)

    context = {
      'user': request.user,
      'course_user': cur_course_user
    }

    # instructor/TA wants to update a response
    serializer = serializers.ResponseSerializer(response,
      data=request.DATA, context=context)

    if serializer.is_valid():
      serializer.save()
      return rest_framework_response.Response(serializer.data)
    return rest_framework_response.Response(serializer.errors, status=422)


@rest_decorators.api_view(['GET', 'POST'])
@decorators.access_controlled
@decorators.student_required
@decorators.submission_released_required
def list_rubrics(request, cur_course_user, submission_id, response_id):
  """ Returns a list of Rubrics for the given Response. """
  response = shortcuts.get_object_or_404(models.Response,
    pk=response_id)

  if request.method == 'GET':
    rubrics = models.Rubric.objects.filter(
      question_part=response.question_part.pk).order_by('id')

    serializer = serializers.RubricSerializer(rubrics, many=True)
    return rest_framework_response.Response(serializer.data)
  elif request.method == 'POST':
    # if user wants to update a rubric, must be an instructor/TA
    if cur_course_user.privilege == models.CourseUser.STUDENT:
      return rest_framework_response.Response(status=403)

    serializer = serializers.RubricSerializer(data=request.DATA, context={
      'question_part': response.question_part })
    if serializer.is_valid():
      serializer.save()
      return rest_framework_response.Response(serializer.data)

    return rest_framework_response.Response(serializer.errors, status=422)


@rest_decorators.api_view(['GET', 'PUT', 'DELETE'])
@decorators.access_controlled
@decorators.student_required
@decorators.submission_released_required
def manage_rubric(request, cur_course_user, submission_id, response_id, rubric_id):
  """ Manages a single Rubric by allowing reads/updates. """
  response = shortcuts.get_object_or_404(models.Response,
    pk=response_id)
  rubric = shortcuts.get_object_or_404(models.Rubric, question_part=response.
    question_part.pk, pk=rubric_id)

  if request.method == 'GET':
    serializer = serializers.RubricSerializer(rubric)
    return rest_framework_response.Response(serializer.data)
  elif request.method == 'PUT':
    # if user wants to update a rubric, must be an instructor/TA
    if cur_course_user.privilege == models.CourseUser.STUDENT:
      return rest_framework_response.Response(status=403)

    serializer = serializers.RubricSerializer(rubric, data=request.DATA, context={
      'question_part': response.question_part })
    if serializer.is_valid():
      serializer.save()
      return rest_framework_response.Response(serializer.data)

    return rest_framework_response.Response(serializer.errors, status=422)
  elif request.method == 'DELETE':
    rubric.delete()
    return rest_framework_response.Response(status=204)


@rest_decorators.api_view(['GET', 'POST'])
@decorators.access_controlled
@decorators.student_required
@decorators.submission_released_required
def list_annotations(request, cur_course_user, submission_id, assessment_page_number):
  """ Returns a list of Annotations for the provided submission and page number """
  submission_page = shortcuts.get_object_or_404(models.SubmissionPage,
    submission=submission_id, page_number=int(assessment_page_number))

  if request.method == 'GET':
    annotations = models.Annotation.objects.filter(submission_page=submission_page)
    serializer = serializers.AnnotationSerializer(annotations, many=True)

    return rest_framework_response.Response(serializer.data)
  elif request.method == 'POST':
    request.DATA['submission_page'] = submission_page.pk

    # The submission page is used by the serializer to validate user input.
    # Note that submission_page is already validated, since otherwise getting
    # the object would 404.
    serializer = serializers.AnnotationSerializer(data=request.DATA,
      context={ 'submission_page': submission_page })
    if serializer.is_valid():
      serializer.save()
      return rest_framework_response.Response(serializer.data)
    return rest_framework_response.Response(serializer.errors, status=422)


@rest_decorators.api_view(['GET', 'PUT', 'DELETE'])
@decorators.access_controlled
@decorators.student_required
@decorators.submission_released_required
def manage_annotation(request, cur_course_user, submission_id, assessment_page_number, annotation_id):
  """ Manages a single Annotation by allowing reads/updates. """
  annotation = shortcuts.get_object_or_404(models.Annotation, pk=annotation_id)
  if request.method == 'GET':
    serializer = serializers.AnnotationSerializer(annotation)
    return rest_framework_response.Response(serializer.data)

  elif request.method == 'PUT' or request.method == 'POST':
    if cur_course_user.privilege == models.CourseUser.STUDENT:
      return rest_framework_response.Response(status=403)

    # The submission page is used by the serializer to validate user input.
    submission_page = shortcuts.get_object_or_404(models.SubmissionPage,
      submission=submission_id, page_number=int(assessment_page_number))

    serializer = serializers.AnnotationSerializer(annotation, data=request.DATA,
      context={ 'submission_page': submission_page })
    if serializer.is_valid():
      serializer.save()
      return rest_framework_response.Response(serializer.data)
    return rest_framework_response.Response(serializer.errors, status=422)

  elif request.method == 'DELETE':
    if cur_course_user.privilege == models.CourseUser.STUDENT:
      return rest_framework_response.Response(status=403)
    annotation.delete()
    return rest_framework_response.Response(status=204)


@decorators.access_controlled
@decorators.student_required
@decorators.submission_released_required
def get_freeform_annotation(request, cur_course_user, submission_id, assessment_page_number):
  """
  Returns the freeform annotation image corresponding to the specific submission
  page. Returns a 404 error if the `FreeformAnnotation` model does not exist.
  """
  submission_page = shortcuts.get_object_or_404(models.SubmissionPage,
    submission=submission_id, page_number=int(assessment_page_number))
  annotation = shortcuts.get_object_or_404(models.FreeformAnnotation, submission_page=submission_page)
  image = requests.get(annotation.annotation_image.url, stream=True)
  return http.StreamingHttpResponse(image, content_type='image/png')


@decorators.access_controlled
@decorators.instructor_or_ta_required
def save_freeform_annotation(request, cur_course_user, submission_id, assessment_page_number):
  """ Save the freeform annotation image for the specified submission page. """
  if request.method != 'POST':
    return http.HttpResponse(status=404)

  submission_page = shortcuts.get_object_or_404(models.SubmissionPage,
    submission=submission_id, page_number=int(assessment_page_number))
  folder_name = 'freeform-annotation-png'

  try:
    annotation = submission_page.freeformannotation
  except models.FreeformAnnotation.DoesNotExist:
    annotation = models.FreeformAnnotation(submission_page=submission_page)
  else:  # If there is an annotation for the given `SubmissionPage`, delete old image from S3
    old_url = annotation.annotation_image.url
    # Get path starting from the folder i.e. remove the domain from the URL
    storage.default_storage.delete(old_url[old_url.index(folder_name):])

  # The image is encoded as a B64 string. Decode it, and save it.
  b64_img = request.POST['annotation_image']
  header = 'data:image/png;base64,'

  # The header must be in the b64_image
  if b64_img[0:len(header)] != header:
    return http.HttpResponse(status=422)

  try:
    img_bytestream = base64.b64decode(b64_img[len(header):])
  except TypeError:
    return http.HttpResponse(status=422)

  # Must be a PNG image
  if imghdr.what(None, img_bytestream) != 'png':
    return http.HttpResponse(status=422)

  img = base.ContentFile(img_bytestream, 'tmp')
  annotation.annotation_image.save(folder_name, img)
  annotation.save()

  return http.HttpResponse(status=204)
