// TODO: browserify
var AssessmentModel = Backbone.Model.extend({
  url: function() {
    return this.collection.url() + this.get('id') + '/';
  },

  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read' && method !== 'create' && method !== 'delete') {
      // we only allow reading/updating/deleting a single instance
      throw 'Can only read/create/delete assessments.';
    }

    // add CSRF token to requests
    options.beforeSend = function(xhr) {
      xhr.setRequestHeader('X-CSRFToken', CSRF_TOKEN);
    };

    return Backbone.sync.apply(this, arguments);
  }
});

var AssessmentCollection = Backbone.Collection.extend({
  model: AssessmentModel,

  url: function() {
    return window.location.pathname + 'assessment/';
  },

  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read') {
      throw 'Can only read the list of assessments.';
    }

    return Backbone.sync.apply(this, arguments);
  }
});
