// TODO: browserify
var CourseUserGradedModel = Backbone.Model.extend({});

var CourseUserGradedCollection = Backbone.Collection.extend({
  model: CourseUserGradedModel,
  url: function() {
    return window.location.href + this.assessmentID  + '/get-students/';
  },

  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read') {
      throw 'Can only read the list of courseUsers.';
    }

    return Backbone.sync.apply(this, arguments);
  },

  setAssessment: function(assessmentID) {
    this.assessmentID = assessmentID;
  },

  getAssessment: function() {
    return this.assessmentID;
  },

  // Groups all the course users who have a common submission
  group_course_users: function(courseUsersGraded) {
    var grouped_course_users = [], types = {};

    for (var i = 0, j = courseUsersGraded.length; i < j; i++) {
      var cur = courseUsersGraded[i];
      if (!(cur.submissionId in types) || cur.submissionId === null) {
        types[cur.submissionId] = cur;
        grouped_course_users.push(types[cur.submissionId]);
      } else {
        types[cur.submissionId].fullName += ', ' + cur.fullName;
        types[cur.submissionId].email += ', ' + cur.email;
        if (!types[cur.submissionId].isMapped) {
          types[cur.submissionId].isMapped = cur.isMapped;
          types[cur.submissionId].questionInfo = cur.questionInfo;
        }
      }
    }
    return grouped_course_users;
  }
});
