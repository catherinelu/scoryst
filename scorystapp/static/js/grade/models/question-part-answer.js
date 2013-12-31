$.cookie.raw = true;
var CSRF_TOKEN = $.cookie('csrftoken');
$.cookie.raw = false;

// TODO: browserify
var QuestionPartAnswerModel = Backbone.Model.extend({
  url: '/api' + window.location.pathname.replace('grade', 'exam-answer') +
    'question-part/',

  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read' && method !== 'update') {
      // we only allow reading/updating a single instance
      throw new Exception('Can only read or update question part answers.');
    }

    // add CSRF token to requests
    options.beforeSend = function(xhr) {
      xhr.setRequestHeader('X-CSRFToken', CSRF_TOKEN);
    };

    options.url = this.url + model.get('question_part') + '/answer/';
    return Backbone.sync.apply(this, arguments);
  }
});
