// TODO: browserify
var CustomPointsView = IdempotentView.extend({
  tagName: 'li',
  template: Handlebars.compile($('.custom-points-template').html()),

  events: {
    'click': 'focusOrDeselect',
    'keydown .custom-points': 'updateCustomPoints'
  },

  /* Initializes the custom points field. Requires a QuestionPartAnswer model. */
  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.listenTo(this.model, 'change:custom_points', this.render);
  },

  /* Renders the custom points field in a new li element. */
  render: function() {
    var questionPartAnswer = this.model.toJSON();
    if (_.isNumber(questionPartAnswer.custom_points)) {
      this.$el.addClass('selected');
    } else {
      this.$el.removeClass('selected');
    }

    this.$el.html(this.template(questionPartAnswer));
    return this;
  },

  /* If the custom points field is already selected, deselect it. Otherwise,
   * focus the input. */
  focusOrDeselect: function() {
    var $target = $(event.target);

    if (this.$el.hasClass('selected')) {
      // don't deselect custom points if the input was clicked
      if (!$target.is('input')) {
        this.model.save({ custom_points: null }, { wait: true });
      }
    } else {
      // custom points is not selected and was just clicked; focus input
      this.$('.custom-points').focus();
    }
  },

  /* Updates the question part answer's custom points field. This function is
   * debounced, so it's only called once the input stops arriving. */
  updateCustomPoints: _.debounce(function(event) {
    var customPoints = parseFloat($(event.currentTarget).val(), 10);
    var newModelProperties;

    this.model.save({
      // only set a valid number of custom points
      custom_points: isNaN(customPoints) ? null : customPoints
    }, { wait: true });
  }, 1000)
});
