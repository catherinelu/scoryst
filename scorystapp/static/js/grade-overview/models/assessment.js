// TODO: browserify
var AssessmentModel = Backbone.Model.extend({});

var AssessmentCollection = Backbone.Collection.extend({
  model: AssessmentModel,
  url: function() {
    return window.location.href + 'assessments/';
  },

  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read') {
      throw 'Can only read the list of assessments.';
    }

    return Backbone.sync.apply(this, arguments);
  }
});
