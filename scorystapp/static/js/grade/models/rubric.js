// TODO: browserify
var RubricModel = Backbone.Model.extend({
  sync: function(method, model, options) {
    throw 'Cannot read/update/delete an individual rubric';
  }
});

var RubricCollection = Backbone.Collection.extend({
  model: RubricModel,
  url: function() {
    return window.location.pathname + 'question-part-answer/' +
      this.questionPartAnswer.get('id') + '/rubrics/';
  },

  initialize: function(models, options) {
    this.questionPartAnswer = options.questionPartAnswer;
  },

  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read') {
      // we only allow reading the list of question parts
      throw 'Can only read the list of rubrics.';
    }

    return Backbone.sync.apply(this, arguments);
  }
});
