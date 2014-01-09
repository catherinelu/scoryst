$(function() {
  var $exams = $('.nav.nav-tabs');
  
  var curExamId = $exams.find('li.active').children().attr('data-exam-id');
  
  var $statisticsTemplate = $('.statistics-template');
  var $statisticsTable = $('.table-container');

  var templates = {
    renderStatisticsTemplate: Handlebars.compile($statisticsTemplate.html())
  };
  
  function renderStatistics() {
    $.ajax({
      url: curExamId + '/get-statistics/',
      dataType: 'json'
    }).done(function(data) {
      $statisticsTable.html(templates.renderStatisticsTemplate(data));

      var ctx = $('#histogram').get(0).getContext('2d');
      var chart_data = {
        labels : data.exam_statistics.histogram.labels,
        datasets : [
          {
            fillColor : 'rgba(151, 187, 205, 0.5)',
            strokeColor : 'rgba(151, 187, 205, 1)',
            data : data.exam_statistics.histogram.histogram
          }
        ]
      }
      new Chart(ctx).Bar(chart_data, wholeNumberAxisFix(chart_data));

      var ctx = $('#myChart').get(0).getContext('2d');
      var chart_data = {
        labels : ['Min','Median','Mean','Max'],
        datasets : [
          {
            fillColor : 'rgba(151, 187, 205, 0.5)',
            strokeColor : 'rgba(151, 187, 205, 1)',
            data : [data.exam_statistics.min,data.exam_statistics.median,data.exam_statistics.mean,data.exam_statistics.max]
          }
        ]
      }
      new Chart(ctx).Bar(chart_data, $.extend({barValueSpacing : 10}, wholeNumberAxisFix(chart_data)));
    
    }).fail(function(request, error) {
      console.log('Error while getting exams overview data: ' + error);
    });
  }

  function wholeNumberAxisFix(data) {
    var maxValue = false;
    for (datasetIndex = 0; datasetIndex < data.datasets.length; ++datasetIndex) {
       var setMax = Math.max.apply(null, data.datasets[datasetIndex].data);
       if (maxValue === false || setMax > maxValue) maxValue = setMax;
    }

    var steps = new Number(maxValue);
    var stepWidth = new Number(1);
    if (maxValue > 10) {
       stepWidth = Math.floor(maxValue / 10);
       steps = Math.ceil(maxValue / stepWidth);
    }
    return { scaleOverride: true, scaleSteps: steps, scaleStepWidth: stepWidth, scaleStartValue: 0 };
  }

  renderStatistics();

  
  // When an exam tab is clicked, update the exam summary.
  $exams.on('click', 'li', function(event) {
    event.preventDefault();
    var $li = $(event.currentTarget);

    $exams.find('li').removeClass('active');
    curExamId = $li.find('a').attr('data-exam-id');
    $li.addClass('active');
    
    renderStatistics();
  });
});
