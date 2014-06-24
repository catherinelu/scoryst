# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # create assessment answer model
        db.create_table(u'scorystapp_submission', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('assessment', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['scorystapp.Assessment'])),
            ('course_user1', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['scorystapp.CourseUser'], null=True, blank=True)),
            ('released1', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('page_count1', self.gf('django.db.models.fields.IntegerField')()),
            ('pdf1', self.gf('django.db.models.fields.files.FileField')(max_length=100))
        ))
        db.send_create_signal(u'scorystapp', ['Submission'])

        # add submission_ptr field for primary key
        db.add_column(u'scorystapp_examanswer', 'submission_ptr',
                      self.gf('django.db.models.fields.related.ForeignKey')(to=orm['scorystapp.Submission'], null=True),
                      keep_default=False)

        # create assessment that corresponds to each exam
        db.start_transaction()
        for exam_answer in orm.ExamAnswer.objects.all():
            submission = orm.Submission(id=exam_answer.id, course_user1=exam_answer.course_user,
                released1=exam_answer.released, assessment=exam_answer.exam, page_count1=exam_answer.page_count,
                pdf1=exam_answer.pdf)
            submission.save()

            exam_answer.submission_ptr = submission
            exam_answer.save()
        db.commit_transaction()

        # convert submission_ptr_id to primary key
        db.create_unique(u'scorystapp_examanswer', ['submission_ptr_id'])
        db.delete_column(u'scorystapp_examanswer', u'id')
        db.create_primary_key(u'scorystapp_examanswer', [u'submission_ptr_id'])

        # delete exam answer columns that we put into assessment answer
        db.delete_column(u'scorystapp_examanswer', 'course_user_id')
        db.delete_column(u'scorystapp_examanswer', 'released')
        db.delete_column(u'scorystapp_examanswer', 'exam_id')


    def backwards(self, orm):
        raise Exception('Sorry, you cannot backwards migrate.')


    models = {
        u'auth.group': {
            'Meta': {'object_name': 'Group'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'auth.permission': {
            'Meta': {'ordering': "(u'content_type__app_label', u'content_type__model', u'codename')", 'unique_together': "((u'content_type', u'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['contenttypes.ContentType']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        u'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'scorystapp.annotation': {
            'Meta': {'object_name': 'Annotation'},
            'comment': ('django.db.models.fields.TextField', [], {'max_length': '1000', 'null': 'True', 'blank': 'True'}),
            'exam_answer_page': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.ExamAnswerPage']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'offset_left': ('django.db.models.fields.FloatField', [], {}),
            'offset_top': ('django.db.models.fields.FloatField', [], {}),
            'rubric': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.Rubric']", 'null': 'True', 'blank': 'True'})
        },
        u'scorystapp.assessment': {
            'Meta': {'object_name': 'Assessment'},
            'cap_score': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'course': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.Course']"}),
            'grade_down': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200'})
        },
        u'scorystapp.submission': {
            'Meta': {'object_name': 'Submission'},
            'assessment': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.Assessment']"}),
            'course_user1': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.CourseUser']", 'null': 'True', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'released1': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'page_count1': ('django.db.models.fields.IntegerField', [], {}),
            'pdf1': ('django.db.models.fields.files.FileField', [], {'max_length': '100'})
        },
        u'scorystapp.course': {
            'Meta': {'object_name': 'Course'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'term': ('django.db.models.fields.IntegerField', [], {}),
            'year': ('django.db.models.fields.IntegerField', [], {'default': '2014'})
        },
        u'scorystapp.courseuser': {
            'Meta': {'object_name': 'CourseUser'},
            'course': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.Course']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'privilege': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.User']"})
        },
        u'scorystapp.exam': {
            'Meta': {'object_name': 'Exam', '_ormbases': [u'scorystapp.Assessment']},
            u'assessment_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['scorystapp.Assessment']", 'unique': 'True', 'primary_key': 'True'}),
            'exam_pdf': ('django.db.models.fields.files.FileField', [], {'max_length': '100', 'blank': 'True'}),
            'page_count': ('django.db.models.fields.IntegerField', [], {}),
            'solutions_pdf': ('django.db.models.fields.files.FileField', [], {'max_length': '100', 'blank': 'True'})
        },
        u'scorystapp.examanswer': {
            'Meta': {'object_name': 'ExamAnswer'},
            u'submission_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': u"orm['scorystapp.Submission']", 'null': 'True'}),
            'course_user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.CourseUser']", 'null': 'True', 'blank': 'True'}),
            'exam': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.Exam']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'page_count': ('django.db.models.fields.IntegerField', [], {}),
            'pdf': ('django.db.models.fields.files.FileField', [], {'max_length': '100'}),
            'preview': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'released': ('django.db.models.fields.BooleanField', [], {'default': 'False'})
        },
        u'scorystapp.examanswerpage': {
            'Meta': {'object_name': 'ExamAnswerPage'},
            'exam_answer': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.ExamAnswer']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_blank': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'page_jpeg': ('django.db.models.fields.files.ImageField', [], {'max_length': '100', 'blank': 'True'}),
            'page_jpeg_large': ('django.db.models.fields.files.ImageField', [], {'max_length': '100', 'blank': 'True'}),
            'page_number': ('django.db.models.fields.IntegerField', [], {})
        },
        u'scorystapp.exampage': {
            'Meta': {'object_name': 'ExamPage'},
            'exam': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.Exam']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'page_jpeg': ('django.db.models.fields.files.ImageField', [], {'max_length': '100', 'blank': 'True'}),
            'page_jpeg_large': ('django.db.models.fields.files.ImageField', [], {'max_length': '100', 'blank': 'True'}),
            'page_number': ('django.db.models.fields.IntegerField', [], {})
        },
        u'scorystapp.questionpart': {
            'Meta': {'object_name': 'QuestionPart'},
            'exam': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.Exam']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'max_points': ('django.db.models.fields.FloatField', [], {}),
            'pages': ('django.db.models.fields.CommaSeparatedIntegerField', [], {'max_length': '200'}),
            'part_number': ('django.db.models.fields.IntegerField', [], {'null': 'True'}),
            'question_number': ('django.db.models.fields.IntegerField', [], {})
        },
        u'scorystapp.questionpartanswer': {
            'Meta': {'object_name': 'QuestionPartAnswer'},
            'custom_points': ('django.db.models.fields.FloatField', [], {'null': 'True', 'blank': 'True'}),
            'exam_answer': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.ExamAnswer']"}),
            'grader': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.CourseUser']", 'null': 'True', 'blank': 'True'}),
            'grader_comments': ('django.db.models.fields.TextField', [], {'max_length': '1000', 'null': 'True', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'pages': ('django.db.models.fields.CommaSeparatedIntegerField', [], {'max_length': '200'}),
            'question_part': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.QuestionPart']"}),
            'rubrics': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['scorystapp.Rubric']", 'symmetrical': 'False'})
        },
        u'scorystapp.rubric': {
            'Meta': {'object_name': 'Rubric'},
            'description': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'points': ('django.db.models.fields.FloatField', [], {}),
            'question_part': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.QuestionPart']"})
        },
        u'scorystapp.split': {
            'Meta': {'object_name': 'Split'},
            'exam': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.Exam']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'pdf': ('django.db.models.fields.files.FileField', [], {'max_length': '100'}),
            'secret': ('django.db.models.fields.TextField', [], {'max_length': '1000'})
        },
        u'scorystapp.splitpage': {
            'Meta': {'object_name': 'SplitPage'},
            'begins_exam_answer': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_blank': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_uploaded': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'page_jpeg': ('django.db.models.fields.files.ImageField', [], {'max_length': '100', 'blank': 'True'}),
            'page_jpeg_large': ('django.db.models.fields.files.ImageField', [], {'max_length': '100', 'blank': 'True'}),
            'page_jpeg_small': ('django.db.models.fields.files.ImageField', [], {'max_length': '100', 'blank': 'True'}),
            'page_number': ('django.db.models.fields.IntegerField', [], {}),
            'split': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.Split']"})
        },
        u'scorystapp.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'unique': 'True', 'max_length': '100', 'db_index': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_signed_up': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'student_id': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        }
    }

    complete_apps = ['scorystapp']