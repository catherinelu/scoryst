// TODO: browserify
var SubmissionsNavView = IdempotentView.extend({
  templates: {
    examAnswersTemplate: _.template(this.$('.exam-answers-template').html()),
    filteringTemplate: _.template(this.$('.exam-answers-filtering-template').html())
  },

  events: {
    'change [type="checkbox"]': 'checkboxFilter',
    'click .exam-answer': 'changeSubmission',
  },

  initialize: function() {
    this.constructor.__super__.initialize.apply(this, arguments);

    this.$studentsScroll = this.$('.students-scroll');
    this.SCROLLBAR_HEIGHT = 500;
    this.renderScrollbar();

    this.isShowAssignedChecked = true;
    this.isShowUnassignedChecked = true;

    this.handleBackButton();
    var currentPath = window.location.pathname;

    // Fetch the basePath for easy change of URLs when the user goes to another student
    var searchStr = currentPath.replace(/^(.*\/)[^\/]*\/$/, '$1');
    this.basePath = currentPath.substr(0, searchStr.length);
    var curSubmissionId = parseInt(currentPath.replace(/^.*\/([^\/]*)\/$/, '$1'));

    this.examAnswers = new SubmissionCollection();

    this.examCanvasView = new ExamCanvasView({
      el: '.exam',
      preloadOtherStudentExams: 0,
      preloadCurExam: 0
    });
    this.examCanvasView.render();

    var self = this;

    // Fetches all the exam answers, sets currentSubmission appropriately and
    // then calls renderSubmissions
    this.examAnswers.fetch({
      success: function() {
        self.currentSubmission = self.examAnswers.filter(function(examAnswer) {
          return examAnswer.id === curSubmissionId;
        })[0];
        self.renderSubmissions();
      }
    });
  },

  renderSubmissions: function() {
    var $examAnswers = this.$('.exam-answers');
    var currentSubmission = this.currentSubmission.toJSON();

    var examAnswers = this.applyFilters();

    $examAnswers.html(this.templates.examAnswersTemplate({
      examAnswers: examAnswers,
      curSubmissionId: currentSubmission.id
    }));

    Mediator.trigger('changeSubmissionName', currentSubmission.name || '');
    this.resizeScrollbar();
  },

  checkboxFilter: function() {
    this.isShowAssignedChecked = $('.show-assigned').is(':checked');
    this.isShowUnassignedChecked = $('.show-unassigned').is(':checked');
    this.renderSubmissions();

    // Select first exam answer under the new filtering rules
    if (this.$('.active').length === 0) {
      this.$('.exam-answer').eq(0).click();
    }
  },

  renderFilters: function(numAssigned, numUnassigned) {
    var $filtering = this.$('.filtering');

    $filtering.html(this.templates.filteringTemplate({
      isShowAssignedChecked: this.isShowAssignedChecked,
      isShowUnassignedChecked: this.isShowUnassignedChecked,

      numAssigned: numAssigned,
      numUnassigned: numUnassigned
    }));
  },

  // Returns `examAnswers` that match the user's filter.
  applyFilters: function() {
    var examAnswers = this.examAnswers.toJSON();
    var numAssigned = 0;
    var numUnassigned = 0;
    var self = this;

    var filteredSubmissions = examAnswers.filter(function(examAnswer) {
      if (examAnswer.courseUser) {
        numAssigned++;
        if (self.isShowAssignedChecked) {
          return true;
        }
      } else {
        numUnassigned++;
        if (self.isShowUnassignedChecked) {
          return true;
        }
      }
      return false;
    });
    self.renderFilters(numAssigned, numUnassigned);
    return filteredSubmissions;
  },

  changeSubmission: function(event) {
    event.preventDefault();
    var $currentTarget = $(event.currentTarget);

    $currentTarget.parents('ul').children('li').removeClass('active');
    $currentTarget.parents('li').addClass('active');

    var examAnswerId = $currentTarget.data('exam-answer-id');
    var self = this;

    // Find the new examAnswer, set it to current and display it
    this.examAnswers.forEach(function(examAnswer) {
      if (examAnswer.id === examAnswerId) {
        var examAnswerObject = examAnswer.toJSON();
        self.showSubmission(examAnswerObject);
        self.currentSubmission = examAnswer;
      }
    });
  },

  assignSubmissionToStudent: function(courseUser) {
    var unassignedId;
    var currentSubmission = this.currentSubmission.toJSON();

    // If this examAnswer was previously assigned to some other student,
    // that student no longer has any exams assigned to him, so we set the
    // unassignedId to his id and return it to the parent view
    if (currentSubmission.courseUser != courseUser) {
      unassignedId = currentSubmission.courseUser;
    }
    var self = this;
    // Save the current exam answer with the correct `courseUser`
    this.currentSubmission.save({
      courseUser: courseUser
    }, {
      success: function() {
        // 1. User is filtering by unassigned. Submission is assigned so no element
        // is active once we render, so it needs to be done before self.renderSubmissions()
        if (self.isShowUnassignedChecked && !self.isShowAssignedChecked) {
          self.$('.active').next().find('a').click();
        }
        self.renderSubmissions();

        // 2. User is filtering by assigned. Submission 1 was assigned to X and Submission 2
        // was assigned to Y. User assigns Submission 1 to Y, now Submission 2 becomes
        // unassigned so it needs to be done after self.renderSubmissions()
        if (!self.isShowUnassignedChecked || self.isShowAssignedChecked) {
          self.$('.active').next().find('a').click();
        }
      },
      wait: true
    });

    // The current student may have been previously assigned an exam answer
    // We loop through all the exams, and see if he was previously assigned
    // If so, we remove that assignment
    this.examAnswers.forEach(function(examAnswer) {
      var examAnswerObject = examAnswer.toJSON();
      if (examAnswer.id !== currentSubmission.id && examAnswerObject.courseUser == courseUser) {
        examAnswer.save({
          courseUser: null
        }, {
          success: function() {
            self.renderSubmissions();
          },
          wait: true
        });
      }
    });

    this.$studentsScroll.customScrollbar('scrollTo',
      'a[data-exam-answer-id="' + currentSubmission.id + '"]');

    return unassignedId;
  },

  showSubmission: function(examAnswer) {
    var newPath = this.basePath + examAnswer.id + '/';
    // update URL with history API; fall back to standard redirect
    if (window.history) {
      window.history.pushState(this.currentSubmission.toJSON(), null, newPath);
      // The URL has changed, so image loader will show the new exam
      this.examCanvasView.showPage();
      Mediator.trigger('changeSubmissionName', examAnswer.name || '');
    } else {
      window.location.pathname = newPath;
    }
  },

  renderScrollbar: function() {
    this.$studentsScroll.css('height', this.SCROLLBAR_HEIGHT + 'px');
    this.$studentsScroll.customScrollbar();
  },

  resizeScrollbar: function() {
    this.$studentsScroll.customScrollbar('resize');
  },

  // To make the back button work, we need to :
  // 1. Set active class for the correct exam answer
  // 2. Show the exam answer
  // 3. Have currentSubmission updated
  // 4. Trigger the mediator
  handleBackButton: function() {
    var self = this;
    // Makes the back button work by handling the popstate event.
    this.listenToDOM($(window), 'popstate', function(event) {
      var prevSubmission = event.originalEvent.state;
      if (!prevSubmission) {
        return;
      }
      self.currentSubmission = self.examAnswers.filter(function(examAnswer) {
        return examAnswer.id === prevSubmission.id;
      })[0];
      self.renderSubmissions();
      self.examCanvasView.showPage();
    });
  }
});
