var PercentileModel = Backbone.Model.extend({});

var PercentileCollection = Backbone.Collection.extend({
  model: PercentileModel,
  url: function() {
    return window.location.pathname + 'percentile/';
  },

  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read') {
      throw 'Can only read the list of percentiles.';
    }
    return Backbone.sync.apply(this, arguments);
  }
});
