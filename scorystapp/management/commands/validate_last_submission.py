from django.core.management.base import BaseCommand, CommandError
from scorystapp import models


class Command(BaseCommand):
  help = ('Makes sure there aren\'t duplicate `last` submissions')

  def handle(self, *args, **options):
    submissions = models.Submission.objects.filter(last=True).order_by('id')

    for submission in submissions:
      more = submissions.filter(assessment=submission.assessment, course_user=submission.course_user)
      if more.count() > 1:
        print '%s has multiple last submissions for %s, %s' % (submission.course_user,
          submission.assessment, submission.assessment.course)

    print 'DONE validating!'
