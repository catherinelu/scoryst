var MainView = Backbone.View.extend({
  initialize: function() {
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
    Mediator.on('changeQuestionPartAnswer', function(questionPartAnswer) {
      self.renderRubricsNav(questionPartAnswer);
    });
  },

  renderExamPDF: function() {
    new ExamPDFView({
      el: this.$('.exam'),
      questionPartAnswers: this.questionPartAnswers
    });
  },

  renderStudentNav: function() {
    new StudentNavView({ el: this.$('.student-nav') });
  },

  renderExamNav: function(questionPartAnswer) {
    var examNav = new ExamNavView({
      el: this.$examNav,
      model: questionPartAnswer,
      questionPartAnswers: this.questionPartAnswers
    }).render();
  },

  renderRubricsNav: function(questionPartAnswer) {
    this.fetchRubrics(questionPartAnswer, function(rubrics) {
      if (this.rubricsNavView) {
        // rubrics view exists; update it
        this.rubricsNavView.setOptions({
          model: questionPartAnswer,
          rubrics: rubrics
        }).render();
      } else {
        // rubrics view hasn't been created yet
        this.rubricsNavView = new RubricsNavView({
          el: this.$rubricsNav,
          model: questionPartAnswer,
          rubrics: rubrics
        }).render();
      }
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
  new MainView({ el: $('.grade') });
});
