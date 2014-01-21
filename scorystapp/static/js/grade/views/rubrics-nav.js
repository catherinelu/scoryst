// TODO: browserify
var RubricsNavView = IdempotentView.extend({
  /* Key code for keyboard shortcuts. */
  A_KEY_CODE: 65,

  template: Handlebars.compile($('.rubrics-nav-template').html()),

  /* Initializes this view. Must be given a DOM element container,
   * a QuestionPartAnswer model, and a list of rubrics. */
  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.rubrics = options.rubrics;

    // re-render whenever model changes
    this.listenToDOM($(window), 'keyup', this.handleShortcuts);
  },

  /* Renders the rubrics navigation. */
  render: function() {
    // deregister any rubric subviews that were added during the last render
    this.deregisterSubview();

    this.$el.html(this.template(this.model.toJSON()));
    var $ol = this.$('ol');

    var self = this;
    var selectedRubrics = this.model.get('rubrics');

    // add a view for each rubric
    this.rubrics.each(function(rubric) {
      var rubricView = new RubricView({
        model: rubric,
        questionPartAnswer: self.model
      });

      $ol.append(rubricView.render().$el);
      self.registerSubview(rubricView);
    });

    // add custom points
    var customPointsView = new CustomPointsView({ model: this.model });
    $ol.append(customPointsView.render().$el);
    this.registerSubview(customPointsView);

    // add commenting
    var commentView = new CommentView({
      model: this.model,
      el: this.$('.comment-container')
    }).render();
    this.registerSubview(commentView);

    window.resizeNav();
    return this;
  },

  /* Handle A, B, ..., Z keyboard shortcuts for selecting rubrics. */
  handleShortcuts: function(event) {
    // ignore keys entered in an input/textarea
    var $target = $(event.target);
    if ($target.is('input') || $target.is('textarea')) {
      return;
    }

    // trigger click event on the rubric that corresponds to the letter clicked
    var index = event.keyCode - this.A_KEY_CODE;
    this.$('li').eq(index).click();
  }
});
