// TODO: browserify
var QuestionPartModel = Backbone.Model.extend({
  sync: function(method, model, options) {
    throw 'Cannot read/update/delete an individual question part';
  }
});

var QuestionPartCollection = Backbone.Collection.extend({
  model: QuestionPartModel,
  url: function() {
    return window.location.pathname + 'question-part/';
  },

  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read') {
      // we only allow reading the list of question parts
      throw 'Can only read the list of question parts.';
    }

    return Backbone.sync.apply(this, arguments);
  }
});
