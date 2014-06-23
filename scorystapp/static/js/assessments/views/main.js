var MainView = IdempotentView.extend({

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.assessments = new AssessmentCollection();
    this.assessmentId = parseInt(this.$('form').attr('data-assessment-id'), 10);

    var self = this;
    this.assessments.fetch({
      success: function() {
        self.renderAssessmentsTable();
        console.log(self.assessments);

        if (self.assessmentId) {
          self.assessment = self.assessments.filter(function(assessment) {
            return assessment.id === self.assessmentId;
          });
          self.assessment = self.assessment[0];  // remove the array
          self.renderAssessmentsForm(self.assessment);
        } else {
          self.renderAssessmentsForm();
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

  renderAssessmentsForm: function(assessment) {
    var assessmentsForm = new AssessmentFormView({
      el: this.$('.assessment-form'),
      assessment: assessment
    }).render();
    this.registerSubview(assessmentsForm);
  }

});

$(function() {
  var mainView = new MainView({
    el: $('.assessments')
  });
});
