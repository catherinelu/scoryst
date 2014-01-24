from django import shortcuts
from django.core import files
from scorystapp import models, decorators, forms
from scorystapp.views import helpers
import sys
import Image
import numpy

# TODO: everything
@decorators.login_required
@decorators.valid_course_user_required
@decorators.instructor_or_ta_required
def upload(request, cur_course_user):
  cur_course = cur_course_user.course
  if request.method == 'POST':
    form = forms.ExamUploadForm(request.POST, request.FILES)
    if form.is_valid():
      # TODO: May not be unique, use select list
      exam = models.Exam.objects.get(course=cur_course, name=form.cleaned_data['exam_name'])
      _break_and_upload(exam, request.FILES['exam_file'])
      return shortcuts.redirect('/course/%s/exams/%s/map/' % (cur_course_user.course.id, exam.id))
  else:
    form = forms.ExamUploadForm()

  return helpers.render(request, 'upload.epy', {
    'title': 'Upload',
    'course': cur_course,
    'form': form
    # 'exams_list': exams_list
  })

def _break_and_upload(exam, f):
  num_pages = _split_to_jpegs(f)
  num_pages_per_exam = exam.page_count * 2

  num_students = num_pages / num_pages_per_exam
  
  question_parts = models.QuestionPart.objects.filter(exam=exam)
  
  # TODO: Fuck my life
  pdf = files.File(open('/tmp/midterm.pdf'))
  for i in range(num_students):
    exam_answer = models.ExamAnswer(course_user=None, exam=exam, page_count=num_pages_per_exam)
    # TODO: Fuck my life
    exam_answer.pdf.save('new', pdf)
    exam_answer.save()

    for j in range(num_pages_per_exam):
      exam_page = models.ExamAnswerPage(exam_answer=exam_answer, page_number=j+1)
      
      njpg = i * num_pages_per_exam + j
      jpgfile = file('/tmp/jpg%d.jpg' % njpg, 'r')
      exam_page.page_jpeg.save('new', files.File(jpgfile))
      exam_page.save()
      jpgfile.close()

    for question_part in question_parts:
      answer_pages=''
      for page in question_part.pages.split(','):
        page = int(page)
        answer_pages = answer_pages +  str(2 * page - 1) + ','
        if 2 * page - 2 and not _is_blank('/tmp/jpg%d.jpg' % (i * num_pages_per_exam +  2 * page - 3)):
          answer_pages = answer_pages +  str(2 * page - 2) + ','
      answer_pages = answer_pages[:-1]
      question_part_answer = models.QuestionPartAnswer(question_part=question_part,
        exam_answer=exam_answer, pages=answer_pages)
      question_part_answer.save()


def _is_blank(file_name):
  print file_name
  im = Image.open(file_name)
  data = numpy.asarray(im) - 255
  print numpy.linalg.norm(data)
  # TODO: 
  if numpy.linalg.norm(data) < 1000:
    return True
  else:
    return False

def _split_to_jpegs(f):
  """
  IDK what this function does, it somehow works
  """
  pdf = f.read()

  startmark = '\xff\xd8'
  startfix = 0
  endmark = '\xff\xd9'
  endfix = 2
  i = 0

  njpg = 0
  while True:
    istream = pdf.find('stream', i)
    if istream < 0:
      break
    istart = pdf.find(startmark, istream, istream+20)
    if istart < 0:
      i = istream+20
      continue
    iend = pdf.find('endstream', istart)
    if iend < 0:
      raise Exception('Did not find end of stream!')
    iend = pdf.find(endmark, iend-20)
    if iend < 0:
      raise Exception('Did not find end of JPG!')
     
    istart += startfix
    iend += endfix
    # print 'JPG %d from %d to %d' % (njpg, istart, iend)
    jpg = pdf[istart:iend]
    jpgfile = file('/tmp/jpg%d.jpg' % njpg, 'wb')
    jpgfile.write(jpg)
    jpgfile.close()
     
    njpg += 1
    i = iend
  print njpg
  return 72 #Really wtf

