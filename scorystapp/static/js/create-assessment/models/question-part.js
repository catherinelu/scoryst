// TODO: browserify
var QuestionPartModel = Backbone.Model.extend({
  url: function() {
    var id = this.get('id');
    var collectionURL = this.collection.url();

    if (id) {
      return collectionURL + id + '/';
    } else {
      return collectionURL;
    }
  },

  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read' && method !== 'create') {
      throw 'Can only read/create question parts.';
    }

    // add CSRF token to requests
    options.beforeSend = Utils.beforeSendCSRFHandler;

    return Backbone.sync.apply(this, arguments);
  },

  validate: function(attrs) {
    var errors = [];
    if (isNaN(attrs.maxPoints)) {
      return 'Please enter an integer point value.';
    }
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
      throw 'Can only read the list of question parts.';
    }

    return Backbone.sync.apply(this, arguments);
  }
});
