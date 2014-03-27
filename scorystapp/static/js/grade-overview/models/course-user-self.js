// TODO: browserify
var CourseUserSelfModel = Backbone.Model.extend({
  url: function() {
    return window.location.href + this.examID  + '/get-self/';
  },
  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read') {
      throw 'Can only read the list of courseUsers.';
    }
    return Backbone.sync.apply(this, arguments);
  },

  setExam: function(examID) {
    this.examID = examID;
  },

  getExam: function() {
    return this.examID;
  }
});
