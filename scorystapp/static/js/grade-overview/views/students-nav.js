// TODO: browserify
var StudentsNavView = IdempotentView.extend({
  templates: {
    studentTemplate: _.template($('.student-template').html()),
    filteringTemplate: _.template($('.student-filtering-template').html()),
  },

  events: {
    'click [type="checkbox"]': 'checkboxChange',
    'change .questions-filter': 'selectChange',
    'click a.name': 'changeStudent',
    'keyup .search': 'searchForStudents'
  },

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.$studentScroll = $('.students-scroll');
    this.renderScrollbar();
    this.previousSearchValue = '';
  },

  render: function(examID) {
    this.examID = examID;

    var courseUsersGraded = new CourseUserGradedCollection();
    courseUsersGraded.setExam(this.examID);

    this.studentSummaryView = new StudentSummaryView({ el: '.student-summary' });
    this.registerSubview(this.studentSummaryView);

    var self = this;
    courseUsersGraded.fetch({
      success: function() {
        self.courseUsersGraded = courseUsersGraded.toJSON();

        // By default, selectedOptionValue is 0, implying the entire exam
        // as opposed to a particular question
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

  checkboxChange: function(event) {
    this.isGradedChecked = $('.graded').is(':checked');
    this.isUngradedChecked = $('.ungraded').is(':checked');
    this.isUnmappedChecked = $('.unmapped').is(':checked');
    this.renderStudentsList();
  },

  selectChange: function(event) {
    this.selectedOptionValue = parseInt($('.questions-filter').val(), 10);
    this.renderFilters();
    this.renderStudentsList();
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
      this.studentSummaryView.render(this.examID, courseUsersToDisplay[0].courseUser);
    }
    this.updateScrollbar();
  },

  // Only returns students to whom the filters applied
  applyFilters: function() {
    var courseUsersToDisplay = [];

    var self = this;
    this.courseUsersGraded.forEach(function(courseUserGraded) {
      var curQuestion = courseUserGraded.questions_info[self.selectedOptionValue];

      if ((curQuestion.is_graded && self.isGradedChecked) ||
        (!curQuestion.is_graded && courseUserGraded.is_mapped && self.isUngradedChecked) ||
        (!courseUserGraded.is_mapped && self.isUnmappedChecked)) {

        courseUsersToDisplay.push({
          courseUser: courseUserGraded,
          selectedOptionValue: self.selectedOptionValue
        });
      }
    });

    return courseUsersToDisplay;
  },

  // Changes the student associated with studentSummaryView
  changeStudent: function(event) {
    event.preventDefault();
    var $target = $(event.target);

    $target.parents('ul').children('li').removeClass('active');
    $target.parents('li').addClass('active');

    var courseUserID = $target.data('course-user-id');

    console.log(this.courseUsersGraded);
    for (var i = 0; i < this.courseUsersGraded.length; i++) {
      if (this.courseUsersGraded[i].id === courseUserID) break;
    }
    // Render the chosen student's exam summary
    this.studentSummaryView.render(this.examID, this.courseUsersGraded[i]);
  },

  // Only displays student names in the nav who match the search query
  searchForStudents: function(event) {
    var $studentSearch = this.$('.search');
    var searchValue = $studentSearch.val().toLowerCase();

    if (this.previousSearchValue === searchValue) return;

    // hide students that don't match search text; show students that do
    this.$el.find('ul').find('li').each(function() {
      var $li = $(this);
      var text = $li.find('a').text();

      if (text.toLowerCase().indexOf(searchValue) === -1) {
        $li.hide();
      } else {
        $li.show();
      }
    });

    this.previousSearchValue = searchValue;
    this.updateScrollbar();
  },

  renderScrollbar: function() {
    // TODO: Stole this from the previous overview page.
    // What's the nicer way of doing this instead of hardcoded height :/
    var SCROLLBAR_HEIGHT = 500;
    this.$studentScroll.css('height', SCROLLBAR_HEIGHT + 'px');
    this.$studentScroll.customScrollbar();
  },

  updateScrollbar: function() {
    this.$studentScroll.customScrollbar('resize');
  }
});
