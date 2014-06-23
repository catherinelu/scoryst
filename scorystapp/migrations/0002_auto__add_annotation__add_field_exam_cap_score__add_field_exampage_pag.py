# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Annotation'
        db.create_table(u'scorystapp_annotation', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('exam_answer_page', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['scorystapp.ExamAnswerPage'])),
            ('question_part_answer', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['scorystapp.QuestionPartAnswer'])),
            ('rubric', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['scorystapp.Rubric'], null=True, blank=True)),
            ('comment', self.gf('django.db.models.fields.TextField')(max_length=1000, null=True, blank=True)),
            ('offset_top', self.gf('django.db.models.fields.FloatField')()),
            ('offset_left', self.gf('django.db.models.fields.FloatField')()),
        ))
        db.send_create_signal(u'scorystapp', ['Annotation'])

        # Adding field 'Exam.cap_score'
        db.add_column(u'scorystapp_exam', 'cap_score',
                      self.gf('django.db.models.fields.BooleanField')(default=True),
                      keep_default=False)

        # Adding field 'ExamPage.page_jpeg_large'
        db.add_column(u'scorystapp_exampage', 'page_jpeg_large',
                      self.gf('django.db.models.fields.files.ImageField')(default='blank', max_length=100, blank=True),
                      keep_default=False)

        # Adding field 'ExamAnswerPage.page_jpeg_large'
        db.add_column(u'scorystapp_examanswerpage', 'page_jpeg_large',
                      self.gf('django.db.models.fields.files.ImageField')(default='blank', max_length=100, blank=True),
                      keep_default=False)


    def backwards(self, orm):
        # Deleting model 'Annotation'
        db.delete_table(u'scorystapp_annotation')

        # Deleting field 'Exam.cap_score'
        db.delete_column(u'scorystapp_exam', 'cap_score')

        # Deleting field 'ExamPage.page_jpeg_large'
        db.delete_column(u'scorystapp_exampage', 'page_jpeg_large')

        # Deleting field 'ExamAnswerPage.page_jpeg_large'
        db.delete_column(u'scorystapp_examanswerpage', 'page_jpeg_large')


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
            'question_part_answer': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.QuestionPartAnswer']"}),
            'rubric': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.Rubric']", 'null': 'True', 'blank': 'True'})
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
            'Meta': {'object_name': 'Exam'},
            'cap_score': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'course': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.Course']"}),
            'exam_pdf': ('django.db.models.fields.files.FileField', [], {'max_length': '100', 'blank': 'True'}),
            'grade_down': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'page_count': ('django.db.models.fields.IntegerField', [], {}),
            'solutions_pdf': ('django.db.models.fields.files.FileField', [], {'max_length': '100', 'blank': 'True'})
        },
        u'scorystapp.examanswer': {
            'Meta': {'object_name': 'ExamAnswer'},
            'course_user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.CourseUser']", 'null': 'True'}),
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