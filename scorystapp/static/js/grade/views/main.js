var MainView = IdempotentView.extend({
  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.id = options.id;
    this.questionPartAnswers = new QuestionPartAnswerCollection();

    this.$examNav = this.$('.exam-nav');
    this.$rubricsNav = this.$('.rubrics-nav');

    var self = this;
    this.questionPartAnswers.fetch({
      success: function() {
        var questionPartAnswer = self.questionPartAnswers.at(0);
        self.renderExamPDF();
        self.renderStudentNav();

        self.renderExamNav(questionPartAnswer);
        self.renderRubricsNav(questionPartAnswer);
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
    this.listenTo(Mediator, 'changeQuestionPartAnswer', function(questionPartAnswer) {
      self.renderRubricsNav(questionPartAnswer);
    });
  },

  renderExamPDF: function() {
    var examPDFView = new ExamPDFView({
      el: this.$('.exam'),
      questionPartAnswers: this.questionPartAnswers
    });

    this.registerSubview(examPDFView);
  },

  renderStudentNav: function() {
    var studentNavView = new StudentNavView({ el: this.$('.student-nav') });
    this.registerSubview(studentNavView);
  },

  renderExamNav: function(questionPartAnswer) {
    var examNav = new ExamNavView({
      el: this.$examNav,
      model: questionPartAnswer,
      questionPartAnswers: this.questionPartAnswers
    }).render();

    this.registerSubview(examNav);
  },

  renderRubricsNav: function(questionPartAnswer) {
    this.fetchRubrics(questionPartAnswer, function(rubrics) {
      if (this.rubricsNavView) {
        // get rid of old view if one exists
        this.deregisterSubview(this.rubricsNavView);
      }

      console.log('new rubric nav', this.id);
      this.rubricsNavView = new RubricsNavView({
        el: this.$rubricsNav,
        model: questionPartAnswer,
        rubrics: rubrics
      }).render();

      this.registerSubview(this.rubricsNavView);
    });
  },

  fetchQuestionPartAnswer: function(questionPart, callback) {
    var questionPartAnswer = new QuestionPartAnswerModel({
      'question_part': { id: questionPart.get('id') }
    });

    var self = this;
    questionPartAnswer.fetch({
      success: function() {
        _.bind(callback, self)(questionPartAnswer);
      },

      error: function() {
        // TODO: handle error
      }
    });
  },

  fetchRubrics: function(questionPartAnswer, callback) {
    var rubrics = new RubricCollection({}, {
      questionPartAnswer: questionPartAnswer
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
  var $grade = $('.grade');
  var mainView = new MainView({ el: $grade, id: 1 });

  /* Change student by re-rendering main view. */
  Mediator.on('changeStudent', function() {
    mainView.removeSideEffects();
    mainView = new MainView({ el: $grade, id: 2 });
  });
});
