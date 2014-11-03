from django.core.management.base import BaseCommand, CommandError
from optparse import make_option
from scorystapp import models


class Command(BaseCommand):
  help = ('Ensures the `graded` and `points` fields in responses and submissions is accurate. ' +
    'If assessment_id and submission_id are not specified, validate consistency for all ' +
    'assessments and submissions')
  option_list = BaseCommand.option_list + (
    make_option('-a', '--assessment_id', help='Specify an assessment to validate'),
    make_option('-s', '--submission_id', help='Specify a submission to validate'),
    make_option('-o', '--submissions_only', action='store_true', help='Only validate submissions'),
    make_option('-f', '--fix', action='store_true', help='Fix inconsistencies found')
  )

  def handle(self, *args, **options):
    assessment_id = options.get('assessment_id', None)
    submission_id = options.get('submission_id', None)
    submissions_only = options.get('submissions_only', None)
    fix = options.get('fix', None)

    if assessment_id:
      if not submissions_only:
        responses = models.Response.objects.filter(submission__assessment=assessment_id)
      submissions = models.Submission.objects.filter(assessment=assessment_id)
    elif submission_id:
      if not submissions_only:
        responses = models.Response.objects.filter(submission=submission_id)
      submissions = models.Submission.objects.filter(pk=submission_id)
    else:
      if not submissions_only:
        responses = models.Response.objects.all()
      submissions = models.Submission.objects.all()


    if not submissions_only:
      for response in responses:
        if response.points != response._get_points() and response._is_graded():
          print 'ERROR: response %d is inconsistent in points field' % response.id
          print response
          if fix:
            response.update_response()
            print 'Fixed'

        if response.graded != response._is_graded():
          print 'ERROR: response %d is inconsistent in graded field' % response.id
          print response
          if fix:
            response.update_response()
            print 'Fixed'

      print '---------------------------------------------------'
      print 'DONE VALIDATING RESPONSES!'
      print '---------------------------------------------------'

    for submission in submissions:
      points = sum(models.Response.objects.values_list('points', flat=True).filter(
        submission=submission))

      if round(submission.points, 4) != round(points, 4):
        print 'ERROR: submission %d is inconsistent in points field' % submission.id
        print submission
        if fix:
          submission.points = points
          submission.save()
          print 'Fixed'

      if submission.graded != submission._is_graded():
        print 'ERROR: submission %d is inconsistent in graded field' % submission.id
        print submission
        if fix:
          submission.graded = submission._is_graded()
          submission.save()
          print 'Fixed'
