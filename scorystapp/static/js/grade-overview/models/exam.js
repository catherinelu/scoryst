// TODO: browserify
var ExamModel = Backbone.Model.extend({
  url: function() {
    return this.collection.url() + this.get('id') + '/';
  },

  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read') {
      // we only allow reading a single instance
      throw 'Can only read exams.';
    }

    // add CSRF token to requests
    options.beforeSend = ModelUtils.beforeSendCSRFHandler;
    return Backbone.sync.apply(this, arguments);
  }
});

var ExamCollection = Backbone.Collection.extend({
  model: ExamModel,
  url: function() {
    return window.location.href + 'exams/';
  },

  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read') {
      // we only allow reading the list of question parts
      throw 'Can only read the list of exams.';
    }

    return Backbone.sync.apply(this, arguments);
  }
});
