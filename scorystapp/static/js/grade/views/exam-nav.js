// TODO: browserify
var ExamNavView = IdempotentView.extend({
  template: Handlebars.compile($('.exam-nav-template').html()),
  events: {
    'click a': 'triggerChangeQuestionPart',
    'click .toggle-exam-nav': 'toggleExamNav'
  },

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.questionPartAnswers = options.questionPartAnswers;

    this.listenTo(Mediator, 'changeQuestionPartAnswer',
      this.changeQuestionPartAnswer);

    var self = this;
    this.questionPartAnswers.each(function(questionPartAnswer) {
      // re-render when any answer changes
      self.listenTo(questionPartAnswer, 'change', self.render);
    });
  },

  /* Renders the question navigation. */
  render: function() {
    // TODO: camel case and underscore discrepancy is really annoying; fix!
    var questionPartAnswers = this.questionPartAnswers.toJSON();
    var activeQuestionPartAnswerId = this.model.get('id');
    var lastQuestionNum = -1;

    questionPartAnswers.forEach(function(questionPartAnswer) {
      // mark question separators
      if (questionPartAnswer.question_part.question_number !== lastQuestionNum) {
        lastQuestionNum = questionPartAnswer.question_part.question_number;
        questionPartAnswer.question_part.starts_new_question = true;
      }

      // mark active question part answer
      if (questionPartAnswer.id === activeQuestionPartAnswerId) {
        questionPartAnswer.active = true;
      }
    });

    var templateData = { question_part_answers: questionPartAnswers };
    this.$el.html(this.template(templateData));

    window.resizeNav();
    return this;
  },

  /* Triggers the changeQuestionPartAnswer event when a part is clicked. */
  triggerChangeQuestionPart: function(event) {
    event.preventDefault();

    var questionPartAnswerId = $(event.currentTarget).
      attr('data-question-part-answer');
    questionPartAnswerId = parseInt(questionPartAnswerId, 10);

    Mediator.trigger('changeQuestionPartAnswer', this.questionPartAnswers.
      get(questionPartAnswerId));
  },

  /* Changes the active question part answer. */
  changeQuestionPartAnswer: function(questionPartAnswer) {
    this.model = questionPartAnswer;
    this.render();
  },

  /* Toggles the visibility of the exam navigation. */
  toggleExamNav: function() {
    this.$el.toggleClass('nav-hidden');
    this.$('ul').toggle(0);
  }
});
