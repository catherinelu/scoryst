// TODO: browserify
var QuestionPartModel = Backbone.Model.extend({
  sync: function(method, model, options) {
    throw new Exception('Cannot read/update/delete an individual question part');
  }
});

var QuestionPartCollection = Backbone.Collection.extend({
  model: QuestionPartModel,
  url: '/api' + window.location.pathname.replace('grade', 'exam-answer') +
    'question-part/',

  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read') {
      // we only allow reading the list of question parts
      throw new Exception('Can only read the list of question parts.');
    }

    return Backbone.sync.apply(this, arguments);
  }
});
