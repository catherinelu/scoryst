var MainView = Backbone.View.extend({
  initialize: function() {
    this.questionParts = new QuestionPartCollection();
    this.$examNav = this.$('.exam-nav');
    this.$rubricsNav = this.$('.rubrics-nav');

    var self = this;
    this.questionParts.fetch({
      success: function() {
        var questionPart = self.questionParts.at(0);
        self.renderExamPDF();

        self.renderQuestionNav(questionPart);
        self.renderRubricsNav(questionPart);
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
    Mediator.on('changeQuestionPart', function(questionPart) {
      self.renderRubricsNav(questionPart);
    });
  },

  renderExamPDF: function() {
    new ExamPDFView({
      el: $('.exam'),
      questionParts: this.questionParts
    });
  },

  renderQuestionNav: function(questionPart) {
    var examNav = new ExamNavView({
      el: this.$examNav,
      model: questionPart,
      questionParts: this.questionParts
    }).render();
  },

  renderRubricsNav: function(questionPart) {
    // TODO: should active question part answer and active rubrics be instance
    // variables?
    this.fetchQuestionPartAnswer(questionPart, function(questionPartAnswer) {
      this.fetchRubrics(questionPart, function(rubrics) {
        if (this.rubricsNavView) {
          // rubrics view exists; update it
          this.rubricsNavView.setOptions({
            model: questionPartAnswer,
            questionPart: questionPart,
            rubrics: rubrics
          }).render();
        } else {
          // rubrics view hasn't been created yet
          this.rubricsNavView = new RubricsNavView({
            el: this.$rubricsNav,
            model: questionPartAnswer,
            questionPart: questionPart,
            rubrics: rubrics
          }).render();
        }
      });
    });
  },

  fetchQuestionPartAnswer: function(questionPart, callback) {
    var questionPartAnswer = new QuestionPartAnswerModel({
      'question_part': questionPart.get('id')
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

  fetchRubrics: function(questionPart, callback) {
    var rubrics = new RubricCollection({}, {
      questionPart: questionPart
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

new MainView({ el: $('.grade') });
