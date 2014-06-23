var AssessmentTablesView = IdempotentView.extend({

  templates: {
    homeworkTableTemplate: _.template($('.homework-row-template').html()),
    examTableTemplate: _.template($('.exam-row-template').html())
  },

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.assessments = options.assessments;
    this.renderAssessmentsTable();
  },

  renderAssessmentsTable: function() {
    var $homeworkTable = $('.homework-table tbody');
    var $examTable = $('.exam-table tbody');
    var self = this;
    var homeworkAssignments = [];
    var exams = [];

    this.assessments.forEach(function(assessment) {
      var assessmentJSON = assessment.toJSON();
      if (assessmentJSON.isExam) {
        exams.push(assessmentJSON);
      } else {
        homeworkAssignments.push(assessmentJSON);
      }
    });

    // fill in the homework table
    homeworkAssignments.forEach(function(homework) {
      $homeworkTable.append(self.templates.homeworkTableTemplate(homework));
    });

    // fill in the exams table
    exams.forEach(function(exam) {
      $examTable.append(self.templates.examTableTemplate(exam));
    });

    this.addPopovers();
  },

  addPopovers: function() {
    // popover gives information when hovered about why deletion is not possible
    var infoPopoverText = 'Once students have been assigned to an exam, that exam' +
      ' can no longer be edited or deleted';

    var $infoPopover = this.$el.find('.info-popover');
    $infoPopover.popover({ content: infoPopoverText });

    // create the popover to warn deletion from roster
    $('.delete').popoverConfirm();
  }
});
