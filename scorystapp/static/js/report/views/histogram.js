var HistogramView = IdempotentView.extend({
  initialize: function() {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.histogram = new HistogramCollection();
  },

  render: function(assessmentId, questionNumber) {
    // Render nothing if no assessmentId is given
    // This would happen if there are no assessments
    if (!assessmentId) {
      this.$el.hide();
      return;
    }

    // Destroy any previously rendered sharts
    if (this.chart) {
      this.chart.destroy();
    }

    this.$el.show();

    this.histogram.setAssessment(assessmentId);
    this.histogram.setQuestion(questionNumber);

    var self = this;
    this.histogram.fetch({
      success: function() {
        var $canvas = $('#histogram');
        var ctx = $canvas[0].getContext('2d');
        var data = self.histogram.toJSON()[0];
        var chartData = {
          labels : data.labels,
          datasets : [
            {
              fillColor : 'rgba(151, 187, 205, 0.5)',
              strokeColor : 'rgba(151, 187, 205, 1)',
              data : data.histogram
            }
          ]
        };

        self.setupCanvas($canvas, chartData);
      },
      error: function(err) {
        console.log(err);
      }
    });
  },

  setupCanvas: function($canvas, chartData) {
    var newWidth = $canvas.parent().width();

    $canvas.prop({
      width: newWidth,
      height: 500
    });

    var ctx = $canvas.get(0).getContext('2d');
    this.chart = new Chart(ctx).Bar(chartData, this.convertToWholeNumberAxis(chartData));
    window.resizeNav();
  },

  // Required to show whole number in the histogram y axis
  convertToWholeNumberAxis: function(data) {
    var maxValue = false;
    for (var datasetIndex = 0; datasetIndex < data.datasets.length; datasetIndex++) {
      var setMax = Math.max.apply(null, data.datasets[datasetIndex].data);

      if (maxValue === false || setMax > maxValue) {
        maxValue = setMax;
      }
    }

    var steps = maxValue;
    var stepWidth = 1;

    if (maxValue > 10) {
      stepWidth = Math.floor(maxValue / 10);
      steps = Math.ceil(maxValue / stepWidth);
    }

    return {
      scaleOverride: true,
      scaleSteps: steps,
      scaleStepWidth: stepWidth,
      scaleStartValue: 0
    };
  }
});
