// TODO: browserify
var RubricModel = Backbone.Model.extend({
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
    options.beforeSend = Utils.beforeSendCSRFHandler;

    // students can only read rubrics
    if (Utils.IS_STUDENT_VIEW && method !== 'read') {
      throw "Can only read rubrics.";
    }

    return Backbone.sync.apply(this, arguments);
  }
});

var RubricCollection = Backbone.Collection.extend({
  model: RubricModel,
  url: function() {
    return window.location.pathname + 'question-part-answer/' +
      this.response.get('id') + '/rubrics/';
  },

  initialize: function(models, options) {
    this.response = options.response;
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
