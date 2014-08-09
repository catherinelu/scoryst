var AssessmentStatisticsModel = Backbone.Model.extend({});

var AssessmentStatisticsCollection = Backbone.Collection.extend({
  model: AssessmentStatisticsModel,
  url: function() {
    return window.location.pathname + 'all-assessment-statistics/';
  },

  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read') {
      // we only allow reading the list of course users
      throw 'Can only read the list of assessment statistics.';
    }

    return Backbone.sync.apply(this, arguments);
  }
});

var QuestionStatisticsModel = Backbone.Model.extend({});

var QuestionStatisticsCollection = Backbone.Collection.extend({
  model: QuestionStatisticsModel,
  url: function() {
    return window.location.pathname + 'assessment-statistics/' + this.assessmentId + '/';
  },

  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read') {
      // we only allow reading the list of course users
      throw 'Can only read the list of assessment statistics.';
    }
    return Backbone.sync.apply(this, arguments);
  },

  setAssessment: function(assessmentId) {
    this.assessmentId = assessmentId;
  },

  getAssessment: function() {
    return this.assessmentId;
  },
});
