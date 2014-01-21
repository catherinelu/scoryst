// TODO: browserify
var RubricsNavHeaderView = IdempotentView.extend({
  template: Handlebars.compile($('.rubrics-nav-header-template').html()),

  /* Initializes this header. Requires a QuestionPartAnswer model. */
  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.listenTo(this.model, 'change:is_graded change:points', this.render);
  },

  render: function() {
    var questionPartAnswer = this.model.toJSON();
    this.$el.html(this.template(questionPartAnswer));
    return this;
  }
});
