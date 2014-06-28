// TODO: browserify
var StudentSummaryView = IdempotentView.extend({
  templates: {
    studentHeadingTemplate: _.template($('.student-heading-template').html()),
    studentSummaryTemplate: _.template($('.student-summary-template').html()),
    noAssessmentTemplate: _.template($('.no-assessment-template').html()),
    notReleasedTemplate: _.template($('.not-released-template').html())
  },

  events: {
    'click a.toggle': 'togglePartDetails',
    'click button.grade': 'goToGradePage'
  },

  render: function(assessmentID, courseUserGraded) {
    // Render nothing
    if (!assessmentID) {
      this.$el.hide();
      return;
    }
    this.$el.show();

    // We store this to retrieve the assessmentAnswerId needed to go to the grade page
    this.courseUserGraded = courseUserGraded;

    this.responses = new ResponseCollection();
    // Since our current URL doesn't have the assessmentID or the courseUserID, we
    // pass those along to the responses collection
    this.responses.setAssessment(assessmentID);
    this.responses.setCourseUserID(courseUserGraded.id);

    var $studentSummaryHeader = $('.student-summary-header');
    $studentSummaryHeader.html(
      this.templates.studentHeadingTemplate({ name: courseUserGraded.fullName })
    );

    var $studentSummaryTable = $('.student-summary-table');
    var self = this;
    this.responses.fetch({
      success: function() {
        var responses = self.responses.toJSON();

        if (responses[0].noMappedAssessment) {
          $studentSummaryTable.html(self.templates.noAssessmentTemplate());
        } else if (responses[0].notReleased) {
          // Not released. Note that notReleased will always return undefined
          // if a TA/instructor is seeing this
          $studentSummaryTable.html(self.templates.notReleasedTemplate());
        } else {
          self.studentSummary = self.responses.aggregateQuestions();
          var studentSummaryHTML = self.templates.studentSummaryTemplate(self.studentSummary);
          $studentSummaryTable.html(studentSummaryHTML);
        }
      },
      error: function() {
        // TODO: Log error message.
      }
    });
  },

  // Used to expand/contract a question to show details of its parts
  togglePartDetails: function(event) {
    event.preventDefault();
    var $currentTarget = $(event.currentTarget);
    var questionNum = parseInt($currentTarget.parents('tr').attr('data-question'), 10);
    this.$el.find('tr.question-part[data-question=' + questionNum + ']').toggle();
    $currentTarget.parents('tr').find('a.toggle').toggle();
  },

  goToGradePage: function(event) {
    var $currentTarget = $(event.currentTarget);

    var questionNumber = parseInt($currentTarget.parents('tr').attr('data-question'), 10);
    var partNumber = 1;
    // set active question/part number for grade page
    $.cookie('activeQuestionNumber', questionNumber, { expires: 1, path: '/' });
    $.cookie('activePartNumber', partNumber, { expires: 1, path: '/' });

    window.location = this.courseUserGraded.submissionId;
  }
});
