var AssessmentFormView = IdempotentView.extend({

  events: {
    'change input[type="radio"]:checked#id_assessment_type_0': 'showHomeworkFields',
    'change input[type="radio"]:checked#id_assessment_type_1': 'showExamFields',
    'keydown #id_num_questions': 'getNumQuestions',
    'keydown #id_num_parts': 'getNumParts'
  },

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);

    $('#id_submission_deadline_picker').datetimepicker({'format': 'MM/DD/YYYY HH:mm'});
    this.addPopover();
  },

  showHomeworkFields: function() {
    $('.homework-fields').show();
    $('.exam-fields').hide();
    $('#id_name').attr('placeholder', 'Problem Set 1');
  },

  showExamFields: function() {
    $('.homework-fields').hide();
    $('.exam-fields').show();
    $('#id_name').attr('placeholder', 'Midterm Exam');
  },

  addPopover: function() {
    var infoPopoverText = 'Exams can be graded down or up. If grading down, exams' +
      ' have perfect scores initially, and each rubric selected deducts points from' +
      ' the total score. If grading up, exams have 0 points awarded initially, and' +
      ' each rubric selected awards points to the total score.';

    var $infoPopover = this.$('.info-popover');
    $infoPopover.popover({ content: infoPopoverText });
  }
});
