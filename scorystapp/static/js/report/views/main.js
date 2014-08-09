var MainView = IdempotentView.extend({
  templates: {
    assessmentStatisticsTemplate: _.template($('.statistics-template').html()),
    questionStatisticsTemplate: _.template($('.question-statistics-template').html())
  },

  events: {
    'click tr': 'updateAssessmentBeingShown',
    'change .view-as-select': 'changeView'
  },

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.assessmentStatistics = new AssessmentStatisticsCollection();

    this.histogramView = new HistogramView({ el: this.$('.histogram-div') });
    this.registerSubview(this.histogramView);

    var self = this;
    this.assessmentStatistics.fetch({
      success: function() {
        assessmentStatistics = self.assessmentStatistics.toJSON();
        // If there are assessments, render the template
        if (assessmentStatistics.length > 0) {
          renderedTemplate = self.templates.assessmentStatisticsTemplate({
            'assessmentStatistics': assessmentStatistics
          });
          self.$('.assessment-statistics').html(renderedTemplate);
          // Expand the last assessment by defauult
          self.$('tr').last().click();
        } else {
          self.$('.assessment-statistics').html('The statistics are not available yet.')
        }
      },
      error: function(err) {
        console.log(err);
      }
    });

    this.percentileView = new PercentileView({ el: this.$('.percentile-div') });
    this.registerSubview(this.percentileView);
  },

  updateAssessmentBeingShown: function(event) {
    var $tr = $(event.currentTarget);
    var $allTr = this.$('tr');

    var assessmentId = $tr.data('assessment-id');
    var questionNumber = $tr.data('question-number');

    var assessmentStatistics = this.assessmentStatistics.find(function(statistics) {
      return statistics.id == assessmentId;
    }).toJSON();

    if (questionNumber) {
      $('.histogram-header').html(assessmentStatistics.name + ': Question ' + questionNumber);
    } else {
      $('.histogram-header').html(assessmentStatistics.name);
    }

    // If it is already selected, don't do anything
    if ($tr.hasClass('selected')) {
      return;
    }

    // Add selected class to the relevant tr
    $allTr.removeClass('selected');
    $tr.addClass('selected');

    // If a new assessment is chosen, toggle the up/down icon
    if (!questionNumber) {
      $allTr.find('.up').addClass('collapse');
      $allTr.find('.down').removeClass('collapse');

      $tr.find('.up').removeClass('collapse');
      $tr.find('.down').addClass('collapse');
    }

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
  },

  changeView: function(event) {
    var $option = $(event.currentTarget);
    var courseUserId = $option.val();
    window.location.href = window.location.href.replace(/report\/\d*/,
      'report/' + courseUserId);
  }
});

$(function() {
  new MainView({ el: $('.report') });
});
