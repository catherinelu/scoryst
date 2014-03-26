// TODO: browserify
var StudentSummaryView = IdempotentView.extend({
  templates: {
    studentHeadingTemplate: _.template($('.student-heading-template').html()),
    studentSummaryTemplate: _.template($('.student-summary-template').html()),
    noExamTemplate: _.template($('.no-exam-template').html()),
    notReleasedTemplate: _.template($('.not-released-template').html())
  },

  events: {
    'click a.toggle': 'togglePartDetails',
    'click button': 'goToGradePage'
  },

  initialize: function(options) {
    // TODO: I should probably delete this function since all it does
    // is call its parent
    this.constructor.__super__.initialize.apply(this, arguments);
  },

  render: function(examID, courseUserGraded) {
    // We store this to retrieve the exam_answer_id needed to go to the grade page
    this.courseUserGraded = courseUserGraded;

    this.questionPartAnswers = new QuestionPartAnswerCollection();
    // Since our current URL doesn't have the examID or the courseUserID, we
    // pass those along to the questionPartAnswers collection
    this.questionPartAnswers.setExam(examID);
    this.questionPartAnswers.setCourseUserID(courseUserGraded.id);

    // Student summary header says "Full Name's Exam Summary "
    var $studentSummaryHeader = $('.student-summary-header');
    $studentSummaryHeader.html(
      this.templates.studentHeadingTemplate({ name: courseUserGraded.full_name })
    );

    var $studentSummaryTable = $('.student-summary-table');
    var self = this;
    this.questionPartAnswers.fetch({
      success: function() {
        var questionPartAnswers = self.questionPartAnswers.toJSON();

        if (questionPartAnswers[0].no_mapped_exam) {
          // No mapped exam
          $studentSummaryTable.html(self.templates.noExamTemplate());
        } else if (questionPartAnswers[0].not_released) {
          // Not released. Note that not_released will always return undefined
          // if a TA/instructor is seeing this
          $studentSummaryTable.html(self.templates.notReleasedTemplate());
        } else {
          // Aggregate the questionPartAnswers into questions
          self.studentSummary = self.questionPartAnswers.aggregateQuestions();
          var template = self.templates.studentSummaryTemplate(self.studentSummary);
          $studentSummaryTable.html(template);
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
    var $target = $(event.currentTarget);
    var questionNum = parseInt($target.parents('tr').attr('data-question'), 10);
    this.$el.find('tr.question-part[data-question=' + questionNum + ']').toggle();
    $target.parents('tr').find('a.toggle').toggle();
  },

  goToGradePage: function(event) {
    var $target = $(event.currentTarget);

    var questionNumber = parseInt($target.parents('tr').attr('data-question'), 10);
    var partNumber = parseInt($target.parents('tr').attr('data-part'), 10);

    // set active question/part number for grade page
    $.cookie('activeQuestionNumber', questionNumber, { expires: 1, path: '/' });
    $.cookie('activePartNumber', partNumber, { expires: 1, path: '/' });

    window.location = this.courseUserGraded.exam_answer_id;
  }
});
