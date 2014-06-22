var MainView = IdempotentView.extend({

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.assessments = new AssessmentCollection();
    this.assessmentId = parseInt(this.$('.assessment-name').attr('data-assessment-id'), 10);

    var self = this;
    this.assessments.fetch({
      success: function() {
        self.renderAssessmentsTable();

        if (isNaN(self.assessmentId)) {
          self.renderAssessmentsForm();
        } else {
          self.renderQuestionPartsForm();
        }
      },

      error: function() {
        // TODO: Log error message.
      }
    });
  },

  renderAssessmentsTable: function() {
    var assessmentsTableView = new AssessmentTablesView({
      el: this.$('.assessments-tables'),
      assessments: this.assessments
    }).render();

    this.registerSubview(assessmentsTableView);
  },

  renderAssessmentsForm: function() {
    var assessmentsForm = new AssessmentFormView({
      el: this.$('.assessment-form')
    }).render();
    this.registerSubview(assessmentsForm);
  },

  renderQuestionPartsForm: function() {
    var questionPartsForm = new QuestionPartsFormView({
      el: this.$('.question-parts'),
      model: this.assessmentId
    });
    this.registerSubview(questionPartsForm);
  }
});

$(function() {
  var mainView = new MainView({
    el: $('.assessments')
  });
});
