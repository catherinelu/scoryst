var MainView = IdempotentView.extend({
  templates: {
    assessmentStatisticsTemplate: _.template($('.statistics-template').html()),
    questionStatisticsTemplate: _.template($('.question-statistics-template').html())
  },

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
        renderedTemplate = self.templates.assessmentStatisticsTemplate({
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

    // If it is already selected, don't do anything
    if ($tr.hasClass('selected')) {
      return;
    }

    $('tr').removeClass('selected');
    $tr.addClass('selected');

    this.histogramView.render(assessmentId, questionNumber);

    // If it isn't a question (i.e. is an assessment), show the question statistics
    // for the assessment
    if (!questionNumber && this.assessmentId != assessmentId) {
      this.assessmentId = assessmentId;
      // Remove all existing questions
      $('tr.question').remove();
      this.showQuestionsForAssessment($tr, assessmentId);
    }
  },

  showQuestionsForAssessment: function($tr, assessmentId) {
    var questionStatistics = new QuestionStatisticsCollection();
    questionStatistics.setAssessment(assessmentId);

    var self = this;
    questionStatistics.fetch({
      success: function() {
        renderedTemplate = self.templates.questionStatisticsTemplate({
          'questionStatistics': questionStatistics.toJSON()
        });
        $tr.after(renderedTemplate);
      },
      error: function(err) {
        console.log(err);
      }
    });
  }
});

$(function() {
  new MainView({ el: $('.report') });
});
