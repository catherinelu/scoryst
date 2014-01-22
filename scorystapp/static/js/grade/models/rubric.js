$.cookie.raw = true;
var CSRF_TOKEN = $.cookie('csrftoken');
$.cookie.raw = false;

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

    // add CSRF token to requests
    options.beforeSend = function(xhr) {
      xhr.setRequestHeader('X-CSRFToken', CSRF_TOKEN);
    };

    return Backbone.sync.apply(this, arguments);
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
