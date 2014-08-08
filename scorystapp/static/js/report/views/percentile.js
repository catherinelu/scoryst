var PercentileView = IdempotentView.extend({
  initialize: function() {
    this.constructor.__super__.initialize.apply(this, arguments);
    // this.$el.length == 0 implies that we are not seeing the report for any student
    // i.e. an instructor/TA is viewing the general statistics, so percentile isn't
    // displayed
    if (this.$el.length > 0) {
      this.showPercentileGraph();
    }
  },

  showPercentileGraph: function() {
    var $canvas = $('#percentile');
    var ctx = $canvas[0].getContext('2d');
    this.percentile = new PercentileCollection();
    var self = this;
    this.percentile.fetch({
      success: function() {
        var data = self.percentile.toJSON()[0];
        // If there has only been one assessment so far, the percentile graph
        // won't work, so we return
        if (data.percentiles.length < 1) {
          return;
        }
        // Show the header (hidden if we aren't showing the percentile graph)
        $('.percentile-header').html('Percentile Score');
        $canvas.prop({
          width: $canvas.parent().width(),
          height: 200
        });

        var chartData = {
          labels : data.labels,
          datasets : [{
            data : data.percentiles,
            fillColor: 'rgba(151,187,205,0.2)',
            strokeColor: 'rgba(151,187,205,1)',
            pointColor: 'rgba(151,187,205,1)',
            pointStrokeColor: '#fff',
            pointHighlightFill: '#fff',
            pointHighlightStroke: 'rgba(151,187,205,1)',
          }]
        };

        var ctx = $canvas.get(0).getContext('2d');
        new Chart(ctx).Line(chartData, { bezierCurve : false });
        window.resizeNav();
      },
      error: function(err) {
        console.log(err);
      }
    });
  }
});
