// TODO: browserify
var RubricModel = Backbone.Model.extend({
  sync: function(method, model, options) {
    throw new Exception('Cannot read/update/delete an individual rubric');
  }
});

var RubricCollection = Backbone.Collection.extend({
  model: RubricModel,
  url: '/api' + window.location.pathname.replace('grade', 'exam-answer') +
    'question-part/',

  initialize: function(models, options) {
    var questionPartId = options.questionPart.get('id');
    this.url = '/api' + window.location.pathname.replace('grade', 'exam-answer') +
      'question-part/' + questionPartId + '/rubrics';
  },

  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read') {
      // we only allow reading the list of question parts
      throw new Exception('Can only read the list of rubrics.');
    }

    return Backbone.sync.apply(this, arguments);
  }
});
