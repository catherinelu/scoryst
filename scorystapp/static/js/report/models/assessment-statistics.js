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
