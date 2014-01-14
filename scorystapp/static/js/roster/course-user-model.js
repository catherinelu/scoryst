$.cookie.raw = true;
var CSRF_TOKEN = $.cookie('csrftoken');
$.cookie.raw = false;

// TODO: browserify
var CourseUserModel = Backbone.Model.extend({
  url: function() {
    return this.collection.url() + this.get('id') + '/';
  },

  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read' && method !== 'update' && method !== 'delete') {
      // we only allow reading/updating/deleting a single instance
      throw 'Can only read/update/delete course users.';
    }

    // add CSRF token to requests
    options.beforeSend = function(xhr) {
      xhr.setRequestHeader('X-CSRFToken', CSRF_TOKEN);
    };

    return Backbone.sync.apply(this, arguments);
  }
});

var CourseUserCollection = Backbone.Collection.extend({
  model: CourseUserModel,
  url: function() {
    return window.location.pathname + 'course-user/';
  },

  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read') {
      // we only allow reading the list of course users
      throw 'Can only read the list of course users.';
    }

    return Backbone.sync.apply(this, arguments);
  }
});
