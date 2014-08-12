var SubmissionModel = Backbone.Model.extend({});

var SubmissionCollection = Backbone.Collection.extend({
  model: SubmissionModel,

  url: function() {
    if (this.studentId) {
      return window.location.href + this.studentId + '/submissions/';
    } else {
      return window.location.href + 'submissions/';
    }
  },

  setStudentId: function(studentId) {
    this.studentId = studentId;
  },

  sync: function(method, model, options) {
    option = options || {};
    options.beforeSend = Utils.beforeSendCSRFHandler;

    if (method !== 'read') {
      throw 'Can only read the list of submissions.';
    }

    return Backbone.sync.apply(this, arguments);
  }
});
