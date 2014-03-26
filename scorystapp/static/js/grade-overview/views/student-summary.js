// TODO: browserify
var StudentSummaryView = IdempotentView.extend({
  templates: {
    studentHeadingTemplate: _.template($('.student-heading-template').html()),
    studentSummaryTemplate: _.template($('.student-summary-template').html()),
  },

  events: {
    // 'click a.name': 'changeStudent'
  },

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);

    this.examID = options.examID;

    this.courseUsersGraded = new CourseUserGradedCollection();

    this.studentSummaryView = new StudentSummaryView();
    this.registerSubview(studentSummaryView);

    var self = this;
    this.courseUsersGraded.fetch({
      success: function() {
        self.render();
      },
      error: function() {
        // TODO: Log error message.
      }
    });
  },

  render: function(examID, courseUserGraded) {
    this.studentSummaryModel() = new StudentSummaryModel();
    this.setExam(examID);
    this.setCourseUser(courseUserGraded);

    var $studentSummaryHeader = $('.student-summary-header');
    $studentSummaryHeader.html(
      this.templates.studentHeadingTemplate(courseUserGraded.fullName)
    );

    var $studentSummaryTable = $('.student-summary-table');

    this.studentSummaryModel.fetch({
      success: function() {
        $studentSummaryTable.html(
          this.templates.studentSummaryTemplate(this.studentSummaryModel)
        );
      },
      error: function() {
        // TODO: Log error message.
      }
    });
  },

});
