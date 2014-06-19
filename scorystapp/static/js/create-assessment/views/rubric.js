var RubricView = IdempotentView.extend({
  template: _.template($('.rubric-template').html()),

  events: {
    'click .fa-trash-o': 'destroy'
  },

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);

    this.questionPart = options.questionPart;
    var self = this;
    this.model.on('invalid', function(model, error) {
      var errorStr = ''
      for (var i = 0; i < error.length; i++) {
        errorStr += error[i].message + ' ';
      }
      self.$el.find('.rubric-points-error').html(errorStr);
    });
  },

  render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    return this;
  },

  save: function() {
    console.log('trying to save rubric...');
    var description = this.$el.find('.rubric-description').val();
    var points = this.$el.find('.rubric-points').val();
    points = parseInt(points, 10);
    var self = this;
    this.model.save({
      description: description,
      points: points
    }, {
      wait: true,

      success: function() {
        self.$el.find('rubric-points-error').html('');
        console.log('successfully saved rubric');
      },  // TODO: return true;

      error: function(model, errors) {
        console.log('there was an error when trying to save');
        console.log(errors);
      }
    });
    console.log('done');
  },

  // deletes this rubric, removing it from the DOM
  destroy: function(event) {
    event.preventDefault();
    this.model.destroy({ wait: true });
    this.removeSideEffects();
    this.remove();
  }
});
