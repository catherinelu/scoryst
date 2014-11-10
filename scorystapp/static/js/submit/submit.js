var HistoryView = Backbone.View.extend({
  templates: {
    historyTemplate: _.template($('.history-template').html()),
    missingEmailsTemplate: _.template($('.missing-emails-template').html()),
    fileSizeExceededTemplate: _.template($('.file-size-exceeded-template').html())
  },

  // In MB. Note that this value is also used in the backend, so in case of
  // any change it must also be changed in the backend.
  MAX_FILE_SIZE: 40,
  BYTES_IN_MB: 1024 * 1024,

  events: {
    'change #id_student_id': 'fetchAndRender',
    'click button[type="submit"]': 'checkForMissingGroupMembers',
    'click .ok-submit': 'submitForm',
    'change #id_homework_id': 'handleHomeworkChange'
  },

  initialize: function(options) {
    this.submissions = new SubmissionCollection();
    this.$select = this.$('#id_student_id');
    this.$tbody = this.$('tbody');
    this.$homeworkSelect = this.$('#id_homework_id');
    this.$groupMembers = this.$('#id_group_members');
    this.$groupMembersFormGroup = this.$('.group-members');
    this.$maxGroupSizeContainer = this.$('.max-group-size');
    this.$missingEmailsError = this.$('.missing-emails-error');
    this.$uploadForm = this.$('.upload-exam');

    // Get a list of the maximum group sizes for each homework (ordered the same
    // as the dropdown). If groups are not allowed, the size is 0.
    this.maxGroupSizesForHomework = JSON.parse(this.$('.max-group-sizes').html());
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


    // Set up the max group size text for the initial load
    var initialHomeworkIndex = this.$homeworkSelect[0].selectedIndex;
    if (this.maxGroupSizesForHomework[initialHomeworkIndex] === 0) {
      this.$groupMembersFormGroup.hide();
    } else {
      this.$maxGroupSizeContainer.html(this.maxGroupSizesForHomework[0]);
    }


    // Creates popovers
    this.$('.finalized-info-popover').popover();

    var pdfInfoPopoverText = 'Not sure how to create a PDF? ' +
      'Just follow the instructions below.';
    var $pdfInfoPopover = this.$('.pdf-info-popover');
    $pdfInfoPopover.popover({ content: pdfInfoPopoverText });

    var $createPdfInfo = this.$('.create-pdf-info');
    // When the popover is being displayed, highlight the part that gives
    // instructions on how to create PDFs
    $pdfInfoPopover.on('shown.bs.popover', function () {
      $createPdfInfo.addClass('highlighted');
    });

    $pdfInfoPopover.on('hidden.bs.popover', function () {
      $createPdfInfo.removeClass('highlighted');
    });
  },

  handleHomeworkChange: function(event) {
    var selectedIndex = event.currentTarget.selectedIndex;
    // Change the max group size text when the user changes homework
    if (this.maxGroupSizesForHomework[selectedIndex]) {
      this.$groupMembersFormGroup.show();
      this.$maxGroupSizeContainer.html(this.maxGroupSizesForHomework[selectedIndex]);
    } else {
      this.$groupMembersFormGroup.hide();
    }
  },

  submitForm: function(event) {
    var self = this;
    if (window.FileReader && window.File && window.FileList && window.Blob) {
      // When the form is submitted, check the file size. If the file size is
      // bigger than MAX_FILE_SIZE, prevent the submission and display an error
      this.$uploadForm.submit(function(event) {
        var $homeworkFile = self.$('#id_homework_file');
        var fileSize = $homeworkFile[0].files[0].size / self.BYTES_IN_MB;
        // Round up to nearest hundredth for display purposes
        fileSize = Math.ceil(fileSize * 100) / 100;

        if (fileSize > self.MAX_FILE_SIZE) {
          $homeworkFile.next('.error').html(self.templates.fileSizeExceededTemplate({
            MAX_FILE_SIZE: self.MAX_FILE_SIZE,
            fileSize: fileSize
          }));
          event.preventDefault();
        } else {
          self.$uploadForm.find('button[type=submit]').attr('disabled', 'disabled');
        }
      });
    }
    this.$uploadForm.submit();
  },

  // This method looks at the group member emails entered and shows a warning
  // if the student forgot any emails that would result in other students no
  // longer having valid submissions.
  checkForMissingGroupMembers: function(event) {
    // Get the emails of group members that were just entered by the user
    var currentEmails = this.$groupMembers.val();
    currentEmails = currentEmails.replace(/\s+/g, '');  // replace spaces
    // if (currentEmails.length === 0) {  // if nothing valid is entered, return
    //   return;
    // }
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
        this.$('.missing-emails-modal').modal('show');
        event.preventDefault();
      } else {
        this.$missingEmailsError.html('');  // TODO: Don't need this
        this.submitForm();
      }
    } else {
      this.$missingEmailsError.html('');
      this.submitForm();
    }
  }
});

$(function() {
  var historyView = new HistoryView({ el: $('.submit') });
  historyView.fetchAndRender();
});
