// TODO: browserify
var StudentsNavView = IdempotentView.extend({
  templates: {
    studentTemplate: _.template($('.student-template').html()),
    filteringTemplate: _.template($('.student-filtering-template').html()),
  },

  events: {
    'click [type="checkbox"]': 'render',
    'change .questions-filter': 'render',
    'click a.name': 'changeStudent'
  },

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);

    this.examID = options.examID;

    var courseUsersGraded = new CourseUserGradedCollection();
    courseUsersGraded.setExam(this.examID);

    // this.studentSummaryView = new StudentSummaryView();
    // this.registerSubview(studentSummaryView);

    var self = this;
    courseUsersGraded.fetch({
      success: function() {
        self.courseUsersGraded = courseUsersGraded.toJSON();

        // By default, selectedOptionValue is 0, implying all questions
        self.selectedOptionValue = 0;
        self.isGradedChecked = true;
        self.isUngradedChecked = true;
        self.isUnmappedChecked = true;

        self.renderFilters();
        self.renderStudentsList();
      },
      error: function() {
        // TODO: Log error message.
      }
    });
  },

  renderFilters: function() {
    var numGraded = 0;
    var numUngraded = 0;
    var numUnmapped = 0;

    var self = this;
    self.courseUsersGraded.forEach(function(courseUserGraded) {
      var curQuestion = courseUserGraded.questions_info[self.selectedOptionValue];
      if (!courseUserGraded.is_mapped) {
        numUnmapped++;
      } else if (curQuestion.is_graded) {
        numGraded++;
      } else {
        numUngraded++;
      }
    });

    var $filtering = $('.filtering');
    $filtering.html(self.templates.filteringTemplate({
      isGradedChecked: self.isGradedChecked,
      isUngradedChecked: self.isUngradedChecked,
      isUnmappedChecked: self.isUnmappedChecked,

      numGraded: numGraded,
      numUngraded: numUngraded,
      numUnmapped: numUnmapped,

      selectedOptionValue: self.selectedOptionValue,
      numQuestions: self.courseUsersGraded[0].questions_info.length
    }));
  },

  renderStudentsList: function() {
    var $courseUsersUL = $('.course-users-ul');
    // Get rid of what was already there
    $courseUsersUL.html('');

    var courseUsersToDisplay = this.applyFilters();
    var self = this;
    courseUsersToDisplay.forEach(function(courseUserToDisplay, index) {
      // Display them
      $courseUsersUL.append(self.templates.studentTemplate({
        courseUserInfo: courseUserToDisplay,
        index: index
      }));
    });
    // Click on the first one (if any)
    if (courseUsersToDisplay.length > 0) {
      // Do its subview shit
      // this.studentSummaryView.render(this.examID, courseUsersToDisplay[0]);
    }
  },

  applyFilters: function() {
    var courseUsersToDisplay = [];

    var self = this;
    this.courseUsersGraded.forEach(function(courseUserGraded) {
      var curQuestion = courseUserGraded.questions_info[self.selectedOptionValue];
      if ((curQuestion.is_graded && self.isGradedChecked) ||
        (!curQuestion.is_graded && courseUserGraded.mapped && self.isUngradedChecked) ||
        (!courseUserGraded.mapped && self.isUnmappedChecked)) {

        courseUsersToDisplay.push({
          courseUser: courseUserGraded,
          selectedOptionValue: self.selectedOptionValue
        });

      }
    });
    return courseUsersToDisplay;
  },

  changeStudent: function(event) {
    event.preventDefault();
    // TODO: Check
    var $target = $(event.target);

    $target.parents('ul').children('li').removeClass('active');
    $target.parents('li').addClass('active');

    var courseUserID = $target.data('course-user-id');

    for (var i = 0; i < this.courseUsersGraded; i++) {
      if (this.courseUsersGraded[i].pk == courseUserID) break;
    }

    // Render the chosen student's exam summary
    // this.studentSummaryView.render(this.examID, this.courseUsersGraded[i]);
  }

});
