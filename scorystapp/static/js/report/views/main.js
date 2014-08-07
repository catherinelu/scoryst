var MainView = IdempotentView.extend({
  template: _.template($('.statistics-template').html()),

  events: {
    'click tr': 'updateAssessmentBeingShown'
  },

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.assessmentStatistics = new AssessmentStatisticsCollection();

    this.histogramView = new HistogramView({ el: this.$('.histogram-div') });
    this.registerSubview(this.histogramView);

    var self = this;
    this.assessmentStatistics.fetch({
      success: function() {
        renderedTemplate = self.template({
          'assessmentStatistics': self.assessmentStatistics.toJSON()
        });
        $('.assessment-statistics').html(renderedTemplate);

        $('tr').last().click();
      },
      error: function(err) {
        console.log(err);
      }
    });
  },

  updateAssessmentBeingShown: function(event) {
    var $tr = $(event.currentTarget);
    var assessmentId = $tr.data('assessment-id');
    var questionNumber = $tr.data('question-number');

    $('tr').removeClass('selected');
    $tr.addClass('selected');
    this.histogramView.render(assessmentId, questionNumber);
  }
});

$(function() {
  new MainView({ el: $('.report') });
});
