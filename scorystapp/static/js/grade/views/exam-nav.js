// TODO: browserify
var ExamNavView = Backbone.View.extend({
  template: Handlebars.compile($('.exam-nav-template').html()),
  events: {
    'click a': 'triggerChangeQuestionPart',
    'click .toggle-exam-nav': 'toggleExamNav'
  },

  initialize: function(options) {
    this.questionParts = options.questionParts;
    Mediator.on('changeQuestionPart', _.bind(this.changeQuestionPart, this));
  },

  /* Renders the question navigation. */
  render: function() {
    // TODO: camel case and underscore discrepancy is really annoying; fix!
    var questionParts = this.questionParts.toJSON();
    var activeQuestionPartId = this.model.get('id');
    var lastQuestionNum = -1;

    questionParts.forEach(function(part) {
      // mark question separators
      if (part.question_number !== lastQuestionNum) {
        lastQuestionNum = part.question_number;
        part.starts_new_question = true;
      }

      // mark active question part
      if (part.id === activeQuestionPartId) {
        part.active = true;
      }
    });

    var templateData = this.model.toJSON();
    templateData.question_parts = questionParts;

    this.$el.html(this.template(templateData));
    window.resizeNav();
    return this;
  },

  /* Triggers the changeQuestionPart event when a part is clicked. */
  triggerChangeQuestionPart: function(event) {
    event.preventDefault();
    var questionPartId = $(event.currentTarget).attr('data-question-part');

    questionPartId = parseInt(questionPartId, 10);
    Mediator.trigger('changeQuestionPart', this.questionParts.get(questionPartId));
  },

  /* Changes the active question part. */
  changeQuestionPart: function(questionPart) {
    this.model = questionPart;
    this.render();
  },

  /* Toggles the visibility of the exam navigation. */
  toggleExamNav: function() {
    this.$el.toggleClass('nav-hidden');
    this.$('ul').toggle(0);
  }
});
