var HistoryView = Backbone.View.extend({
  templates: {
    historyTemplate: _.template($('.history-template').html()),
    missingEmailsTemplate: _.template($('.missing-emails-template').html())
  },

  events: {
    'change #id_student_id': 'handleStudentChange',
    'keyup #id_group_members': 'checkForMissingGroupMembers',
    'change #id_homework_id': 'checkForMissingGroupMembers'
  },

  initialize: function(options) {
    this.submissions = new SubmissionCollection();
    this.$select = this.$('#id_student_id');
    this.$tbody = this.$('tbody');
    this.$homeworkSelect = this.$('#id_homework_id');
    this.$groupMembers = this.$('#id_group_members');
    this.$missingEmailsError = this.$('.missing-emails-error');
  },

  fetchAndRender: function() {
    var self = this;

    // If it is the staff view, the select is shown and they can choose
    // a student to submit for. If it is the student view, you can't change
    // the studentId
    if (this.$select.length > 0) {
      var studentId = this.$select.val();
      this.submissions.setStudentId(studentId);

      // Also, as staff, update the hidden html element storing the current
      // student's name. This is used for showing the missing emails error.
      var text = this.$('#id_student_id option:selected').text();
      var email = text.substring(text.indexOf('<') + 1, text.indexOf('>'));
      this.$('.cur-student-email').html(email);
    }

    this.submissions.fetch({
      success: function() {
        self.lastSubmissions = self.submissions.filter(function(submission) {
          return submission.get('last');
        });

        self.render();
      }
    });
  },

  render: function() {
    var templateData = { submissions: this.submissions.toJSON() };
    this.$tbody.html(this.templates.historyTemplate(templateData));
    $('.finalized-info-popover').popover();
  },

  handleStudentChange: function() {
    this.fetchAndRender();
    this.checkForMissingGroupMembers();
  },

  // This method looks at the group member emails entered and shows a warning
  // if the student forgot any emails that would result in other students no
  // longer having valid submissions.
  checkForMissingGroupMembers: _.debounce(function(event) {
    // Get the emails of group members that were just entered by the user
    var currentEmails = this.$groupMembers.val();
    currentEmails = currentEmails.replace(/\s+/g, '');  // replace spaces
    if (currentEmails.length === 0) {  // if nothing valid is entered, return
      return;
    }
    currentEmails = currentEmails.split(',');

    // Find the submission where `last=True` that this submission would replace, if any
    var currentHomeworkId = this.$homeworkSelect.val();
    var lastSubmission = _.find(this.lastSubmissions, function(submission) {
      return submission.get('assessmentId') == currentHomeworkId;
    });

    if (lastSubmission) {  // A submision will be replaced, so we might need a warning
      var previousEmails = lastSubmission.get('groupMembers')[1];

      // Email of the student submitting (so this email doesn't need to be entered)
      var curStudentEmail = this.$('.cur-student-email').html();
      // All of the emails corresponding to students who would lose their submission
      var missing = previousEmails.filter(function(prevEmail) {
        return curStudentEmail !== prevEmail && currentEmails.indexOf(prevEmail) === -1;
      });

      if (missing.length > 0) {
        var templateData = { missingEmails: missing };
        this.$missingEmailsError.html(this.templates.missingEmailsTemplate(templateData));
      } else {
        this.$missingEmailsError.html('');
      }
    } else {
      this.$missingEmailsError.html('');
    }
  }, 1000)
});

$(function() {
  var historyView = new HistoryView({ el: $('.submit') });
  historyView.fetchAndRender();
});
