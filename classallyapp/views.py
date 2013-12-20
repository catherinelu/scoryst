from boto.s3.key import Key
from classallyapp import models, forms, decorators
from django import shortcuts, http
from django.contrib import messages, auth
from django.utils import timezone, simplejson
import json
import string
import random
import time


def login(request, redirect_path):
  """ Allows the user to log in. """
  # redirect path is relative to root
  redirect_path = '/%s' % redirect_path

  if request.user.is_authenticated():
    return shortcuts.redirect(redirect_path)

  if request.method == 'POST':
    form = forms.UserLoginForm(request.POST)

    if form.is_valid():
      # authentication should pass cleanly (already checked by UserLoginForm)
      user = auth.authenticate(username=form.cleaned_data['email'],
        password=form.cleaned_data['password'])
      auth.login(request, user)

      return shortcuts.redirect(redirect_path)
  else:
    form = forms.UserLoginForm()

  return _render(request, 'login.epy', {
    'title': 'Login',
    'login_form': form,
  })


# TODO: docs
def logout(request):
  auth.logout(request)
  return shortcuts.redirect('/login')


@decorators.login_required
def new_course(request):
  """ Allows the user to create a new course to grade. """
  if request.method == 'POST':
    form = forms.CourseForm(request.POST)

    if form.is_valid():
      course = form.save()
      course_user = models.CourseUser(user=request.user,
          course=course, privilege=models.CourseUser.INSTRUCTOR)
      course_user.save()
  else:
    form = forms.CourseForm()

  return _render(request, 'new-course.epy', {
    'title': 'New Course',
    'new_course_form': form,
  })


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def exams(request, cur_course_user):
  """Overview of all of the students' exams and grades for a particular exam."""

  return _render(request, 'exams.epy', {
    'title': 'Exams',
  })


@decorators.login_required
@decorators.course_required
@decorators.student_required
def view_exam(request, cur_course_user, exam_answer_id):
  """
  Intended as the URL for students who are viewing their exam. Renders the same
  grade template.
  """
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  is_student = cur_course_user.privilege == models.CourseUser.STUDENT

  return _render(request, 'grade.epy', {
    'title': 'View Exam',
    'course': cur_course_user.course.name,
    'studentName': exam_answer.course_user.user.get_full_name(),
    'isStudent' : is_student,
  })


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def grade(request, cur_course_user, exam_answer_id):
  """ Allows an instructor/TA to grade an exam. """
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)

  return _render(request, 'grade.epy', {
    'title': 'Grade',
    'course': cur_course_user.course.name,
    'studentName': exam_answer.course_user.user.get_full_name(),
  })


@decorators.login_required
@decorators.course_required
def get_rubrics(request, cur_course_user, exam_answer_id, question_number, part_number):
  """
  Returns rubrics, merged from rubrics and graded rubrics, associated with the
  particular question number and part number as JSON.

  The resulting rubrics have the following fields: description, points, custom
  (bool), and selected (bool).
  """
  # Get the corresponding exam answer
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)

  # Get the question corresponding to the question number and part number
  question = shortcuts.get_object_or_404(models.Question, exam=exam_answer.exam_id,
      question_number=question_number, part_number=part_number)

  question_answer = shortcuts.get_object_or_404(models.QuestionAnswer,
    exam_answer=exam_answer, question=question)

  # Get the rubrics and graded rubrics associated with the particular exam and
  # question part.
  rubrics = (models.Rubric.objects.filter(question=question)
    .order_by('question__question_number', 'question__part_number', 'id'))
  graded_rubrics = (models.GradedRubric.objects.filter(question=question)
    .order_by('question__question_number', 'question__part_number', 'id'))

  rubrics_to_return = {
    'rubrics': [],
    'graded': False,
    'points': question.max_points,
    'maxPoints': question.max_points,
    'questionNumber': question_number,
    'partNumber': part_number,
  }

  if question_answer.grader is not None:
    user = question_answer.grader.user
    rubrics_to_return['grader'] = (user.first_name + ' ' + user.last_name + ' ('
      + user.email + ')')

  # Merge the rubrics and graded rubrics into a list of rubrics (represented as
  # dicts) with the following fields: description, points, custom, and selected.
  for rubric in rubrics:
    cur_rubric = {
      'description': rubric.description,
      'points': rubric.points,
      'custom': False,
      'rubricPk': rubric.pk,
      'selected': False,
    }
    cur_rubric['color'] = 'red' if cur_rubric['points'] < 0 else 'green'

    # Iterate over graded rubrics and check if it is actually selected.
    # TODO: Make more efficient than O(N^2)?
    for graded_rubric in graded_rubrics:
      if graded_rubric.rubric == rubric:
        cur_rubric['selected'] = True
        break
    rubrics_to_return['rubrics'].append(cur_rubric)

  for graded_rubric in graded_rubrics:
    rubrics_to_return['graded'] = True
    # Check to see if there is a custom rubric.
    if graded_rubric.custom_points != None:
      rubrics_to_return['points'] += graded_rubric.custom_points
      cur_rubric = {
        'description': 'Custom points',
        'points': graded_rubric.custom_points,
        'custom': True,
        'selected': True,
      }
      cur_rubric['color'] = 'red' if cur_rubric['points'] < 0 else 'green'

      rubrics_to_return['rubrics'].append(cur_rubric)
    else:
      rubrics_to_return['points'] += graded_rubric.rubric.points

  # Add in the comment field
  try:
    question_answer = models.QuestionAnswer.objects.get(exam_answer=exam_answer,
      question=question)
  except models.QuestionAnswer.DoesNotExist:
    return http.HttpResponse(status=422)

  rubrics_to_return['comment'] = False
  if len(question_answer.grader_comments) > 0:
    rubrics_to_return['graderComments'] = question_answer.grader_comments
    rubrics_to_return['comment'] = True

  return http.HttpResponse(json.dumps(rubrics_to_return),
    mimetype='application/json')


@decorators.login_required
@decorators.course_required
def get_exam_summary(request, cur_course_user, exam_answer_id, question_number, part_number):
  """
  Returns the questions and question answers as JSON.

  The resulting questions have the following fields: points, maxPoints, graded
  (bool), and a list of objects representing a particular question part. Each
  of these question part objects have the following fields: questionNum,
  partNum, active (bool), partPoints, and maxPoints. 
  """

  # Get the corresponding exam answer
  exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)

  # Get the questions and question answers. Will be used for the exam
  # navigation.
  questions = models.Question.objects.filter(exam=exam_answer.exam).order_by(
    'question_number', 'part_number')
  question_answers = models.QuestionAnswer.objects.filter(
    exam_answer=exam_answer_id)

  exam_to_return = {
      'points': 0,
      'maxPoints': 0,
      'graded': True,
      'questions': [],
  }

  cur_question = 0

  for question in questions:
    if question.question_number != cur_question:
      new_question = {}
      new_question['questionNumber'] = question.question_number
      exam_to_return['questions'].append(new_question)
      cur_question += 1

    cur_last_question = exam_to_return['questions'][-1]
    if 'parts' not in cur_last_question:
      cur_last_question['parts'] = []
    
    cur_last_question['parts'].append({})
    part = cur_last_question['parts'][-1]
    part['partNumber'] = question.part_number
    part['graded'] = False

    # Set active field
    part['active'] = False
    if (question.question_number == int(question_number) and
        question.part_number == int(part_number)):
      part['active'] = True

    part['maxPartPoints'] = question.max_points
    exam_to_return['maxPoints'] += question.max_points

    # Set the part points. We are assuming that we are grading up.
    part['partPoints'] = question.max_points  # Only works for grading up.
    graded_rubrics = models.GradedRubric.objects.filter(question=question)
    for graded_rubric in graded_rubrics:
      part['graded'] = True
      if graded_rubric is not None:
        part['partPoints'] += graded_rubric.rubric.points
      else:  # TODO: Error-handling if for some reason both are null?
        part['partPoints'] += graded_rubric.custom_points

    # Update the overall exam
    if not part['graded']:  # If a part is ungraded, the exam is ungraded
      exam_to_return['graded'] = False
    else:  # If a part is graded, update the overall exam points
      exam_to_return['points'] += part['partPoints']

  return http.HttpResponse(json.dumps(exam_to_return), mimetype='application/json')


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def save_graded_rubric(request, cur_course_user, exam_answer_id, question_number,
  part_number, rubric_id, add_or_delete):
  """
  Given a rubric_id, either add a graded_rubric corresponding to that rubric (if
  add_or_delete == 'add') or else delete the graded_rubric corresponding to that
  rubric.
  """

  rubric = shortcuts.get_object_or_404(models.Rubric, pk=rubric_id)

  if add_or_delete == 'add':
    exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
    question = shortcuts.get_object_or_404(models.Question, exam=exam_answer.exam,
      question_number=question_number, part_number=part_number)
    question_answer = shortcuts.get_object_or_404(models.QuestionAnswer,
      exam_answer=exam_answer_id, question=question)

    # Update the question_answer's grader to this current person
    question_answer.grader = cur_course_user
    question_answer.save()

    # Create and save the new graded_rubric (this marks the rubric as graded)
    graded_rubric = models.GradedRubric(question_answer=question_answer,
      question=question, rubric=rubric)
    graded_rubric.save()
  else:
    graded_rubric = shortcuts.get_object_or_404(models.GradedRubric, rubric=rubric)
    graded_rubric.delete()  # Effectively unmarks the rubric as graded

  return http.HttpResponse(status=200)


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def save_comment(request, cur_course_user, exam_answer_id, question_number, part_number):
  """
  The comment to be saved should be given as a GET parameter. Saves the comment
  in the associated question_answer.
  """

  try:
    comment = request.GET['comment']
  except:
    return http.HttpResponse(status=422)  # Bad GET variable / user semantic error

  question_answer = shortcuts.get_object_or_404(models.QuestionAnswer,
    exam_answer=exam_answer_id, question__question_number=question_number,
    question__part_number=part_number)
  question_answer.grader_comments = comment
  question_answer.save()

  return http.HttpResponse(status=200)


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def get_previous_student(request, cur_course_user, exam_answer_id, question_number, part_number):
  """
  Given a particular student's exam, returns the grade page for the previous
  student, ordered alphabetically by last name, then first name, then email.
  If there is no previous student, the same student is returned. The question
  number and part number are also returned as GET parameters.
  """

  cur_exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  exam_answers = models.ExamAnswer.objects.filter(exam=cur_exam_answer.exam).order_by(
    'course_user__user__last_name', 'course_user__user__first_name', 'course_user__user__email')
  prev_exam_answer = None

  for exam_answer in exam_answers:
    if exam_answer.id == int(exam_answer_id):  # Match is found
      if prev_exam_answer is None:  # No previous student, so stay at same student
        # TODO: never use query strings; always put variables in URL directly
        return http.HttpResponseRedirect('/course/%d/grade/%s/?q=%s&p=%s' %
          (cur_course_user.course.id, exam_answer_id, question_number, part_number))
      else:
        # TODO: no query string
        return http.HttpResponseRedirect('/course/%d/grade/%d/?q=%s&p=%s' %
          (cur_course_user.course.id, prev_exam_answer.id, question_number, part_number))
    else:  # No match yet. Update prev_exam_answer.
      prev_exam_answer = exam_answer

  return http.HttpResponse(status=500)  # Should never reach.


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def get_next_student(request, cur_course_user, exam_answer_id, question_number, part_number):
  """
  Given a particular student's exam, returns the grade page for the next
  student, ordered alphabetically by last name, then first name, then email.
  If there is no previous student, the same student is returned. The question
  number and part number are also returned as GET parameters.
  """

  cur_exam_answer = shortcuts.get_object_or_404(models.ExamAnswer, pk=exam_answer_id)
  found_exam_answer = False
  exam_answers = models.ExamAnswer.objects.filter(exam=cur_exam_answer.exam).order_by(
    'course_user__user__last_name', 'course_user__user__first_name', 'course_user__user__email')

  for exam_answer in exam_answers:
    if exam_answer.id == int(exam_answer_id):  # Match is found
      found_exam_answer = True
    elif found_exam_answer:
      # TODO: no query string
      return http.HttpResponseRedirect('/course/%d/grade/%d/?q=%s&p=%s' %
        (cur_course_user.course.id, exam_answer.id, question_number, part_number))

  if found_exam_answer:  # If the exam was the last one
    # TODO: no query string
    return http.HttpResponseRedirect('/course/%d/grade/%s/?q=%s&p=%s' %
      (cur_course_user.course.id, exam_answer_id, question_number, part_number))

  return http.HttpResponse(status=500)  # Should never reach.


@decorators.login_required
@decorators.course_required
@decorators.instructor_required
def roster(request, cur_course_user):
  """ Allows the instructor to manage a course roster. """
  cur_course = cur_course_user.course

  if request.method == 'POST':
    form = forms.AddPeopleForm(request.POST)

    if form.is_valid():
      people = form.cleaned_data.get('people')
      privilege = form.cleaned_data.get('privilege')

      for person in people.splitlines():
        first_name, last_name, email, student_id = person.split(',')

        # for each person, find/create a corresponding user
        try:
          user = models.User.objects.get(email=email)
        except models.User.DoesNotExist:
          password = _generate_random_string(50)
          user = models.User.objects.create_user(email, first_name, last_name,
            student_id, password)

        try:
          course_user = models.CourseUser.objects.get(user=user.pk, course=cur_course.pk)
        except models.CourseUser.DoesNotExist:
          # add that user to the course
          course_user = models.CourseUser(user=user, course=cur_course,
            privilege=privilege)
        else:
          # if the user is already in the course, simply update his/her privileges
          course_user.privilege = privilege

        course_user.save()

      return shortcuts.redirect(request.path)
  else:
    form = forms.AddPeopleForm()

  course_users = models.CourseUser.objects.filter(course=cur_course.pk)
  return _render(request, 'roster.epy', {
    'title': 'Roster',
    'add_people_form': form,
    'course': cur_course,
    'course_users': course_users,
  })

@decorators.login_required
@decorators.course_required
@decorators.instructor_required
def delete_from_roster(request, cur_course_user, course_user_id):
  """ Allows the instructor to delete a user from the course roster. """
  cur_course = cur_course_user.course
  # TODO: does this ensure the course is cur_course, or does it just use the pk?
  models.CourseUser.objects.filter(pk=course_user_id, course=cur_course).delete()

  return shortcuts.redirect('/course/%d/roster' % cur_course.pk)


def _generate_random_string(length):
  """ Generates a random string with the given length """
  possible_chars = string.ascii_letters + string.digits
  char_list = [random.choice(possible_chars) for i in range(length)]
  return ''.join(char_list)


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def upload_exam(request, cur_course_user):
  """
  Step 1 of creating an exam where the user enters the name of the exam, a blank
  exam pdf and optionally a solutions pdf. On success, we redirect to the
  create-exam page
  """
  if request.method == 'POST':
    form = forms.ExamUploadForm(request.POST, request.FILES)
    if form.is_valid():
      # TODO; should use django-storage and file upload field here
      empty_file_path = _handle_upload_to_s3(request.FILES['exam_file'])
      if 'exam_solutions_file' in request.FILES:
        sample_answer_path = _handle_upload_to_s3(request.FILES['exam_solutions_file'])
      else:
        sample_answer_path = ''
      # TODO; put more blank lines in your code for better readability
      cur_course = cur_course_user.course
      exam = models.Exam(course=cur_course, name=form.cleaned_data['exam_name'],
        empty_file_path=empty_file_path, sample_answer_path=sample_answer_path)
      exam.save()

      return shortcuts.redirect('/course/%d/create-exam/%d' % (cur_course.pk, exam.pk))
  else:
    form = forms.ExamUploadForm()

  return _render(request, 'upload-exam.epy', {
    'title': 'Upload',
    'form': form
  })


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def create_exam(request, cur_course_user, exam_id):
  """
  Step 2 of creating an exam. We have an object in the Exam models and now are 
  adding the questions and rubrics.
  """
  exam = shortcuts.get_object_or_404(models.Exam, pk=exam_id)
  if request.method == 'POST':
    questions_json = json.loads(request.POST['questions-json'])
    # Validate the new rubrics and store the new forms in form_list
    success, form_list = _validate_create_exam(questions_json)

    if not success:
      for error in form_list:
        messages.add_message(request, messages.ERROR, error)
    else:
      # TODO: Does it delete those rubrics that have this as a foreign key?
      # If we are editing an existing exam, delete the previous one
      models.Question.objects.filter(exam=exam).delete()

      for form_type, form in form_list:
        # TODO: bad one-letter variable name
        f = form.save(commit=False)
        if form_type == 'question':
          f.exam = exam
          f.save()
          question = models.Question.objects.get(pk=f.id)
        else:
          f.question = question
          f.save()

  return _render(request, 'create-exam.epy', {'title': 'Create'})


# TODO: docs
@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def map_exams(request, cur_course_user, exam_id):
  return _render(request, 'map-exams.epy', {'title': 'Map Exams'})


# TODO: docs
@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
def students_info(request, cur_course_user, exam_id):
  exam = shortcuts.get_object_or_404(models.Exam, pk=exam_id)
  students = models.CourseUser.objects.filter(course=cur_course_user.course,
    privilege=models.CourseUser.STUDENT)

  students_to_return = []
  for student in students:
    # TODO: use literal syntax for succinctness
    student_to_return = {}
    student_to_return['name'] = student.user.get_full_name()
    student_to_return['email'] = student.user.email
    student_to_return['student_id'] = student.user.student_id
    student_to_return['tokens'] = [student.user.first_name, student.user.last_name]
    
    try:
      exam_answer = models.ExamAnswer.objects.get(course_user=student,exam=exam)
      student_to_return['mapped'] = True
    except:
      student_to_return['mapped'] = False
    students_to_return.append(student_to_return)

  return http.HttpResponse(json.dumps(students_to_return), mimetype='application/json')


@decorators.login_required
@decorators.course_required
# TODO: instructor required?
def get_empty_exam(request, cur_course_user, exam_id):
  """ Returns the URL where the pdf of the empty uploaded exam can be found """
  # TODO: remove
  from time import time
  start = time()
  exam = shortcuts.get_object_or_404(models.Exam, pk=exam_id)
  url = _get_url_for_file(exam.empty_file_path)
  print time() - start
  return shortcuts.redirect(url)


@decorators.login_required
@decorators.course_required
@decorators.instructor_or_ta_required
# TODO: instructor required?
def recreate_exam(request, cur_course_user, exam_id):
  """
  Needed to edit exam rubrics. Returns a JSON to the create-exam.js ajax call
  that will then call recreate-exam.js to recreat the UI
  """
  # TODO: more blank lines for readability
  # TODO: explain what you're doing with inline comments
  try:
    exam = models.Exam.objects.get(pk=exam_id)
  except models.Exam.DoesNotExist:
    return http.HttpResponse(status=422)
  return_list = []
  questions = models.Question.objects.filter(exam_id=exam.id)
  question_number = 0
  for question in questions:
    if question_number != question.question_number:
      question_number += 1
      return_list.append([])

    # use literal syntax for succinctness
    part = {}
    part['points'] = question.max_points
    part['pages'] = question.pages.split(',')
    part['rubrics'] = []
    rubrics = models.Rubric.objects.filter(question=question)
    for rubric in rubrics:
      # spaces after { and before }; generally put dicts with multiple keys on multiple lines
      part['rubrics'].append({'description': rubric.description, 'points': rubric.points})
    return_list[question_number - 1].append(part)

  return http.HttpResponse(json.dumps(return_list), mimetype='application/json')
    

# TODO: this function doesn't "handle" an upload. It uploads a file to s3. Just call it
# upload_file_to_s3 or upload_to_s3; handle suggests this is an event listener
def _handle_upload_to_s3(f):
  """ Uploads file f to S3 and returns the key """
  bucket = models.AmazonS3.bucket
  k = Key(bucket)
  key = _generate_random_string(20) + str(int(time.time()))
  k.key = key
  k.set_contents_from_file(f)
  return key


def _get_url_for_file(key):
  """ Given the key to a file on S3, creates a temporary url and returns it """
  # TODO: remove
  from time import time
  start = time()
  bucket = models.AmazonS3.bucket
  print "getting the bucket took: ", time() - start
  s3_file_path = bucket.get_key(key)
  print "got key: ", time() - start
  # expiry time is in seconds
  # TODO: Change to 60 for deployment
  url = s3_file_path.generate_url(expires_in=600)
  print "got url: ", time() - start
  return url


# TODO: validate_exam would probably be a better name. "create" makes it confusing
def _validate_create_exam(questions_json):
  # TODO: what do you mean by "adds the 'forms' to form_list"? be clearer
  # what is form list? what are 'forms'?
  """
  Validates the questions_json and adds the 'forms' to form_list If this
  function returns successfully, form_list will be a list of tuples where each
  tuple is: ('question' | 'rubric', form)
  We can then save the form, add the foreign keys and then commit it
  Returns:
  True, form_list if validation was successful
  False, errors_list if validation failed
  """
  form_list = []
  question_number = 0

  # Loop over all the questions
  for question in questions_json:
    question_number += 1
    part_number = 0

    # Loop over all the parts
    for part in question:
      part_number += 1
      # Create the json needed for QuestionForm validation
      question_form_json = {
        'question_number': question_number,
        'part_number': part_number,
        'max_points': part['points'],
        # TODO: parens unecessary around ','
        'pages': (',').join(map(str, part['pages']))
      }

      form = forms.QuestionForm(question_form_json)
      if form.is_valid():
        form_list.append(('question', form))
      else:
        return False, form.errors.values()

      for rubric in part['rubrics']:
        rubric_json = {
          'description': rubric['description'],
          'points': rubric['points']
        }

        form = forms.RubricForm(rubric_json)
        if form.is_valid():
          form_list.append(('rubric', form))
        else:
          return False, form.errors.values()

  return True, form_list


def _render(request, template, data={}):
  """
  Renders the template for the given request, passing in the provided data.
  Adds extra data attributes common to all templates.
  """
  # fetch all courses this user is in
  if request.user.is_authenticated():
    course_users = models.CourseUser.objects.filter(user=request.user.pk)
    courses = map(lambda course_user: course_user.course, course_users)
  else:
    courses = []

  extra_data = {
    'courses': courses,
    'path': request.path,
    'user': request.user,
    'is_authenticated': request.user.is_authenticated(),
    'year': timezone.now().year,
  }
  extra_data.update(data)
  return shortcuts.render(request, template, extra_data)
