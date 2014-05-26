from django.core import files
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from optparse import make_option
from scorystapp import models

import PyPDF2
import json
import os
import random
import glob

class Command(BaseCommand):
  help = 'Manually uploads pdfs'
  option_list = BaseCommand.option_list + (
    make_option(
      "-f",
      "--foldername",
      help="Specify foldername containing pdf. Absolute path",
    ),

    make_option(
      "-e",
      "--exam",
      help="Specify exam id",
    ),
  )

  def handle(self, *args, **options):
    """
    Split the pdf into smaller pdfs- one for each exam, as well as jpegs and then
    calls create_unmapped_exam_answers
    """
    old_folder = os.getcwd()
    folder = options['foldername']

    exam = models.Exam.objects.get(pk=options['exam'])
    # folder = '/home/deploy/xiaofei'
    os.chdir(folder)

    # find all PDFs
    pdfs = glob.glob('*.pdf')

    # Get list of
    for pdf in pdfs:
      entire_pdf = PyPDF2.PdfFileReader(file(pdf, 'rb'))

      # Makes the assumption that all exams have the same number of pages
      num_pages = entire_pdf.getNumPages()

      # Makes the assumption that each page has questions on one side and nothing on the other
      num_pages_per_exam = exam.page_count * 2
      num_students = num_pages / num_pages_per_exam

      name_prefix, pdf_extension = pdf.split('.')

      for cur_student in range(num_students):
        # For each student, create a new pdf
        single_student_pdf = PyPDF2.PdfFileWriter()

        for cur_page in range(num_pages_per_exam):
          page = entire_pdf.pages[cur_student * num_pages_per_exam + cur_page]
          single_student_pdf.addPage(page)

        single_student_pdf.write(file('%s/%s%d.pdf' % (folder, name_prefix, cur_student), 'wb'))

      create_unmapped_exam_answers(exam, folder, name_prefix, num_pages_per_exam, num_students)

    os.chdir(old_folder)

    def create_unmapped_exam_answers(exam, folder, name_prefix, num_pages_per_exam, num_students):
      question_parts = models.QuestionPart.objects.filter(exam=exam)

      for cur_student in range(num_students):
        exam_answer = models.ExamAnswer(course_user=None, exam=exam, page_count=num_pages_per_exam)
        temp_pdf_name = '%s/%s%d.pdf' % (folder, name_prefix, cur_student)

        temp_pdf = file(temp_pdf_name, 'rb')
        exam_answer.pdf.save('new', files.File(temp_pdf))
        exam_answer.save()
        os.remove(temp_pdf_name)

        for cur_page in range(num_pages_per_exam):
          exam_answer_page = models.ExamAnswerPage(exam_answer=exam_answer, page_number=cur_page+1)

          cur_page_num = cur_student * num_pages_per_exam + cur_page
          temp_jpeg_name = '%s/%s%d.jpeg' % (folder, name_prefix, cur_page_num)
          temp_jpeg = file(temp_jpeg_name, 'rb')
          exam_answer_page.page_jpeg.save('new', files.File(temp_jpeg))

          # Doing this because this script is a worst case scenario and we're probably
          # short on time so don't want another upload.
          exam_answer_page.page_jpeg_large = exam_answer_page.page_jpeg

          exam_answer_page.save()
          temp_jpeg.close()

        for question_part in question_parts:
          answer_pages=''
          for page in question_part.pages.split(','):
            page = int(page)
            answer_pages = answer_pages +  str(2 * page - 1) + ','
          # Remove the trailing comma (,) from the end of answer_pages
          answer_pages = answer_pages[:-1]
          response = models.Response(question_part=question_part,
            exam_answer=exam_answer, pages=answer_pages)
          response.save()

        for cur_page in range(num_pages_per_exam):
          cur_page_num = cur_student * num_pages_per_exam + cur_page
          temp_jpeg_name = '%s/%s%d.jpeg' % (folder, name_prefix, cur_page_num)
          # os.remove(temp_jpeg_name)
