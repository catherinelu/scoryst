# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'User'
        db.create_table(u'scorystapp_user', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('password', self.gf('django.db.models.fields.CharField')(max_length=128)),
            ('last_login', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime.now)),
            ('is_superuser', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('email', self.gf('django.db.models.fields.EmailField')(unique=True, max_length=100, db_index=True)),
            ('first_name', self.gf('django.db.models.fields.CharField')(max_length=30)),
            ('last_name', self.gf('django.db.models.fields.CharField')(max_length=30)),
            ('is_staff', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('is_active', self.gf('django.db.models.fields.BooleanField')(default=True)),
            ('student_id', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('is_signed_up', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('date_joined', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime.now)),
        ))
        db.send_create_signal(u'scorystapp', ['User'])

        # Adding M2M table for field groups on 'User'
        m2m_table_name = db.shorten_name(u'scorystapp_user_groups')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('user', models.ForeignKey(orm[u'scorystapp.user'], null=False)),
            ('group', models.ForeignKey(orm[u'auth.group'], null=False))
        ))
        db.create_unique(m2m_table_name, ['user_id', 'group_id'])

        # Adding M2M table for field user_permissions on 'User'
        m2m_table_name = db.shorten_name(u'scorystapp_user_user_permissions')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('user', models.ForeignKey(orm[u'scorystapp.user'], null=False)),
            ('permission', models.ForeignKey(orm[u'auth.permission'], null=False))
        ))
        db.create_unique(m2m_table_name, ['user_id', 'permission_id'])

        # Adding model 'Course'
        db.create_table(u'scorystapp_course', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('term', self.gf('django.db.models.fields.IntegerField')()),
            ('year', self.gf('django.db.models.fields.IntegerField')(default=2014)),
        ))
        db.send_create_signal(u'scorystapp', ['Course'])

        # Adding model 'CourseUser'
        db.create_table(u'scorystapp_courseuser', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['scorystapp.User'])),
            ('course', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['scorystapp.Course'])),
            ('privilege', self.gf('django.db.models.fields.IntegerField')(default=0)),
        ))
        db.send_create_signal(u'scorystapp', ['CourseUser'])

        # Adding model 'Exam'
        db.create_table(u'scorystapp_exam', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('course', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['scorystapp.Course'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('page_count', self.gf('django.db.models.fields.IntegerField')()),
            ('exam_pdf', self.gf('django.db.models.fields.files.FileField')(max_length=100, blank=True)),
            ('solutions_pdf', self.gf('django.db.models.fields.files.FileField')(max_length=100, blank=True)),
            ('grade_down', self.gf('django.db.models.fields.BooleanField')(default=True)),
        ))
        db.send_create_signal(u'scorystapp', ['Exam'])

        # Adding model 'ExamPage'
        db.create_table(u'scorystapp_exampage', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('exam', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['scorystapp.Exam'])),
            ('page_number', self.gf('django.db.models.fields.IntegerField')()),
            ('page_jpeg', self.gf('django.db.models.fields.files.ImageField')(max_length=100, blank=True)),
        ))
        db.send_create_signal(u'scorystapp', ['ExamPage'])

        # Adding model 'QuestionPart'
        db.create_table(u'scorystapp_questionpart', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('exam', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['scorystapp.Exam'])),
            ('question_number', self.gf('django.db.models.fields.IntegerField')()),
            ('part_number', self.gf('django.db.models.fields.IntegerField')(null=True)),
            ('max_points', self.gf('django.db.models.fields.FloatField')()),
            ('pages', self.gf('django.db.models.fields.CommaSeparatedIntegerField')(max_length=200)),
        ))
        db.send_create_signal(u'scorystapp', ['QuestionPart'])

        # Adding model 'Rubric'
        db.create_table(u'scorystapp_rubric', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('question_part', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['scorystapp.QuestionPart'])),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('points', self.gf('django.db.models.fields.FloatField')()),
        ))
        db.send_create_signal(u'scorystapp', ['Rubric'])

        # Adding model 'ExamAnswer'
        db.create_table(u'scorystapp_examanswer', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('exam', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['scorystapp.Exam'])),
            ('course_user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['scorystapp.CourseUser'], null=True)),
            ('page_count', self.gf('django.db.models.fields.IntegerField')()),
            ('preview', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('pdf', self.gf('django.db.models.fields.files.FileField')(max_length=100)),
            ('released', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal(u'scorystapp', ['ExamAnswer'])

        # Adding model 'ExamAnswerPage'
        db.create_table(u'scorystapp_examanswerpage', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('exam_answer', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['scorystapp.ExamAnswer'])),
            ('page_number', self.gf('django.db.models.fields.IntegerField')()),
            ('page_jpeg', self.gf('django.db.models.fields.files.ImageField')(max_length=100, blank=True)),
        ))
        db.send_create_signal(u'scorystapp', ['ExamAnswerPage'])

        # Adding model 'QuestionPartAnswer'
        db.create_table(u'scorystapp_questionpartanswer', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('exam_answer', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['scorystapp.ExamAnswer'])),
            ('question_part', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['scorystapp.QuestionPart'])),
            ('pages', self.gf('django.db.models.fields.CommaSeparatedIntegerField')(max_length=200)),
            ('grader_comments', self.gf('django.db.models.fields.TextField')(max_length=1000, null=True, blank=True)),
            ('grader', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['scorystapp.CourseUser'], null=True, blank=True)),
            ('custom_points', self.gf('django.db.models.fields.FloatField')(null=True, blank=True)),
        ))
        db.send_create_signal(u'scorystapp', ['QuestionPartAnswer'])

        # Adding M2M table for field rubrics on 'QuestionPartAnswer'
        m2m_table_name = db.shorten_name(u'scorystapp_questionpartanswer_rubrics')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('questionpartanswer', models.ForeignKey(orm[u'scorystapp.questionpartanswer'], null=False)),
            ('rubric', models.ForeignKey(orm[u'scorystapp.rubric'], null=False))
        ))
        db.create_unique(m2m_table_name, ['questionpartanswer_id', 'rubric_id'])


    def backwards(self, orm):
        # Deleting model 'User'
        db.delete_table(u'scorystapp_user')

        # Removing M2M table for field groups on 'User'
        db.delete_table(db.shorten_name(u'scorystapp_user_groups'))

        # Removing M2M table for field user_permissions on 'User'
        db.delete_table(db.shorten_name(u'scorystapp_user_user_permissions'))

        # Deleting model 'Course'
        db.delete_table(u'scorystapp_course')

        # Deleting model 'CourseUser'
        db.delete_table(u'scorystapp_courseuser')

        # Deleting model 'Exam'
        db.delete_table(u'scorystapp_exam')

        # Deleting model 'ExamPage'
        db.delete_table(u'scorystapp_exampage')

        # Deleting model 'QuestionPart'
        db.delete_table(u'scorystapp_questionpart')

        # Deleting model 'Rubric'
        db.delete_table(u'scorystapp_rubric')

        # Deleting model 'ExamAnswer'
        db.delete_table(u'scorystapp_examanswer')

        # Deleting model 'ExamAnswerPage'
        db.delete_table(u'scorystapp_examanswerpage')

        # Deleting model 'QuestionPartAnswer'
        db.delete_table(u'scorystapp_questionpartanswer')

        # Removing M2M table for field rubrics on 'QuestionPartAnswer'
        db.delete_table(db.shorten_name(u'scorystapp_questionpartanswer_rubrics'))


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
            'page_number': ('django.db.models.fields.IntegerField', [], {})
        },
        u'scorystapp.exampage': {
            'Meta': {'object_name': 'ExamPage'},
            'exam': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['scorystapp.Exam']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'page_jpeg': ('django.db.models.fields.files.ImageField', [], {'max_length': '100', 'blank': 'True'}),
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