var MainView = IdempotentView.extend({
  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.responses = new ResponseCollection();

    this.$examNav = this.$('.exam-nav');
    this.$rubricsNav = this.$('.rubrics-nav');

    var self = this;
    this.responses.fetch({
      success: function() {
        var response = self.responses.filter(
          function(response) {
            var questionPart = response.get('questionPart');

            // find the question part that matches the given active question/part numbers
            return questionPart.questionNumber === options.activeQuestionNumber &&
              questionPart.partNumber === options.activePartNumber;
          })[0];

        // default to first question part answer
        if (!response) {
          response = self.responses.at(0);
        }

        self.renderExamCanvas(response);
        self.renderStudentNav();

        self.renderExamNav(response);
        self.renderRubricsNav(response);
        self.addMediatorListeners();
      },

      error: function() {
        // TODO: handle error
      }
    });
  },

  addMediatorListeners: function() {
    var self = this;
    // update rubrics nav whenever question part changes
    this.listenTo(Mediator, 'changeResponse', function(response) {
      self.renderRubricsNav(response);
    });
  },

  renderExamCanvas: function(response) {
    var shouldPreloadExams = !Utils.IS_STUDENT_VIEW && !Utils.IS_PREVIEW;
    var examCanvasGradeView = new ExamCanvasGradeView({
      response: response,
      preloadOtherStudentExams: (shouldPreloadExams) ? 2 : 0,
      preloadCurExam: 2,
      el: this.$('.exam')
    });

    this.registerSubview(examCanvasGradeView);
  },

  renderStudentNav: function() {
    var studentNavView = new StudentNavView({ el: this.$('.student-nav') });
    this.registerSubview(studentNavView);
  },

  renderExamNav: function(response) {
    var examNav = new ExamNavView({
      el: this.$examNav,
      model: response,
      responses: this.responses
    }).render();

    this.registerSubview(examNav);
  },

  renderRubricsNav: function(response) {
    this.fetchRubrics(response, function(rubrics) {
      if (this.rubricsNavView) {
        // get rid of old view if one exists
        this.deregisterSubview(this.rubricsNavView);
      }

      this.rubricsNavView = new RubricsNavView({
        el: this.$rubricsNav,
        model: response,
        rubrics: rubrics
      }).render();

      this.registerSubview(this.rubricsNavView);
    });
  },

  fetchResponse: function(questionPart, callback) {
    var response = new ResponseModel({
      'questionPart': { id: questionPart.get('id') }
    });

    var self = this;
    response.fetch({
      success: function() {
        _.bind(callback, self)(response);
      },

      error: function() {
        // TODO: handle error
      }
    });
  },

  fetchRubrics: function(response, callback) {
    var rubrics = new RubricCollection({}, {
      response: response
    });

    var self = this;
    rubrics.fetch({
      success: function() {
        _.bind(callback, self)(rubrics);
      },

      error: function() {
        // TODO: handle error
      }
    });
  }
});

$(function() {
  // TODO: the active question/part numbers are global to all exams (midterm,
  // final, etc), when they should be local to the current exam. nevertheless,
  // making them local is annoying, and having invalid question/part numbers
  // just defaults back to the first question/part, so I think this is fine
  var activeQuestionNumber = $.cookie('activeQuestionNumber') || 1;
  var activePartNumber = $.cookie('activePartNumber') || 1;

  /* Keep track of the active question/part number. */
  Mediator.on('changeResponse', function(response) {
    var questionPart = response.get('questionPart');
    activeQuestionNumber = questionPart.questionNumber;
    activePartNumber = questionPart.partNumber;

    $.cookie('activeQuestionNumber', activeQuestionNumber, { path: '/' });
    $.cookie('activePartNumber', activePartNumber, { path: '/' });
  });

  var $grade = $('.grade');
  var mainView = new MainView({
    el: $grade,
    activeQuestionNumber: activeQuestionNumber,
    activePartNumber: activePartNumber
  });

  /* Change student by re-rendering main view. */
  Mediator.on('changeStudent', function() {
    mainView.removeSideEffects();

    mainView = new MainView({
      el: $grade,
      activeQuestionNumber: activeQuestionNumber,
      activePartNumber: 1
    });

    activePartNumber = 1;
    $.cookie('activePartNumber', activePartNumber, { path: '/' });
  });
});
