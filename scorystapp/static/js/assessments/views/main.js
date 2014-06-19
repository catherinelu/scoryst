var MainView = IdempotentView.extend({

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.assessments = new AssessmentCollection();

    var self = this;
    this.assessments.fetch({
      success: function() {
        self.renderAssessmentsTable();
        self.renderAssessmentsForm();
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
    var assessmentsForm = new AssessmentFormView({ el: this.$('.assessment-form')}).render();
    this.registerSubview(assessmentsForm);
  }
});

$(function() {
  var mainView = new MainView({
    el: $('.assessments')
  });
});
