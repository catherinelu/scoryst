var HistogramModel = Backbone.Model.extend({});

var HistogramCollection = Backbone.Collection.extend({
  model: HistogramModel,
  url: function() {
    if (this.assessmentId && this.questionNumber) {
      return window.location.pathname + 'histogram/' + this.assessmentId + '/' + this.questionNumber;
    } else {
      return window.location.pathname + 'histogram/' + this.assessmentId + '/';
    }
  },

  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read') {
      // we only allow reading the list of course users
      throw 'Can only read the histogram data.';
    }

    return Backbone.sync.apply(this, arguments);
  },

  setAssessment: function(assessmentId) {
    this.assessmentId = assessmentId;
  },

  getAssessment: function() {
    return this.assessmentId;
  },

  setQuestion: function(questionNumber) {
    this.questionNumber = questionNumber;
  },

  getQuestion: function(questionNumber) {
    return this.questionNumber;
  }
});
