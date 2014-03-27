// TODO: browserify
var ExamModel = Backbone.Model.extend({});

var ExamCollection = Backbone.Collection.extend({
  model: ExamModel,
  url: function() {
    return window.location.href + 'exams/';
  },

  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read') {
      throw 'Can only read the list of exams.';
    }

    return Backbone.sync.apply(this, arguments);
  }
});
