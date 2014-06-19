var AssessmentFormView = IdempotentView.extend({

  events: {
    'change input[type="radio"]:checked#id_assessment_type_0': 'showHomeworkFields',
    'change input[type="radio"]:checked#id_assessment_type_1': 'showExamFields',
    'keydown #id_num_questions': 'renderNumPartFields',
    'keyup .num-parts': 'updateCommaSeparatedField'
  },

  template: _.template($('.num-parts-field-template').html()),

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    $('#id_submission_deadline_picker').datetimepicker({'format': 'MM/DD/YYYY HH:mm'});
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

  renderNumPartFields: _.debounce(function(event) {
    var numQuestions = parseFloat($(event.currentTarget).val(), 10);
    var htmlToAdd = ''
    for (var i = 0; i < numQuestions; i++) {
      htmlToAdd += this.template({'questionNum': i + 1});
    }
    $('.num-parts-form-group').html(htmlToAdd);
    this.updateCommaSeparatedField();
  }, 500),

  updateCommaSeparatedField: function() {
    var field = '';
    $('.num-parts').each(function() {
      field += $(this).val() + ',';
    });
    field = field.slice(0, -1);  // remove last comma
    $('#id_num_parts_per_question').val(field);
  }
});
