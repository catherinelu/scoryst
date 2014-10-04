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
    var groupedCourseUsers = [], submissionIdMap = {};

    for (var i = 0, j = courseUsersGraded.length; i < j; i++) {
      var cur = courseUsersGraded[i];
      if (!(cur.submissionId in submissionIdMap) || cur.submissionId === null) {
        submissionIdMap[cur.submissionId] = cur;
        groupedCourseUsers.push(submissionIdMap[cur.submissionId]);
      } else {
        submissionIdMap[cur.submissionId].fullName += ', ' + cur.fullName;
        submissionIdMap[cur.submissionId].email += ', ' + cur.email;
        if (!submissionIdMap[cur.submissionId].isMapped) {
          submissionIdMap[cur.submissionId].isMapped = cur.isMapped;
          submissionIdMap[cur.submissionId].questionInfo = cur.questionInfo;
        }
      }
    }
    return groupedCourseUsers;
  }
});
