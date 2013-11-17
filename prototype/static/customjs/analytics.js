jQuery(function($) {
	var oTable1 = $('#sample-table-2').dataTable( {
	"aoColumns": [
      null, null,null, null, null, null
	] } );
});

$(document).ready(function() {
  function createHistogram() {
    overall_mean = [];
    for (var i = 0; i <=9; i+=0.25) {
      overall_mean.push([i, 71]);
    }
    var datasets = {
      "Mean": {
        label: "Mean",
        data: [[0, 85], [1, 85], [2, 32], [3, 66.67], [4, 80], [5, 80], [6, 85], 
        [7, 75], [8, 58], [9, 65]]

      },
      "Overall Mean": {
        label: "Overall Mean",
        data: overall_mean,
        points: {show: true, fill: true, radius: 0.6, fillColor: "rgba(0,0,0,1)"}
      },
      "Worst": {
        label: "Low",
        data: [[0, 60], [1, 15], [2, 0], [3, 50], [4, 40], [5, 10], [6, 0], [7, 15],
         [8, 30], [9, 10]]

      },
      "Best": {
        label: "High",
        data: [[0, 100], [1, 100], [2, 65], [3, 80], [4, 95], [5, 90], [6, 100],
         [7, 85], [8, 90], [9, 70]]
      }
    };

    var i = 0;
    $.each(datasets, function(key, val) {
      val.color = i;
      if (i==1) val.color = "black";
      ++i;
    });

    // insert checkboxes 
    var choiceContainer = $("#histogram_choices");
    $.each(datasets, function(key, val) {
      choiceContainer.append("&nbsp;&nbsp;&nbsp;&nbsp;<input type='checkbox' name='" + key +
        "' checked='checked' id='id" + key + "'></input>&nbsp;&nbsp;" +
        "<label for='id" + key + "'>"
        + val.label + "</label>");
    });

    choiceContainer.find("input").click(plotAccordingToChoices);

    function plotAccordingToChoices() {

      var data = [];

      choiceContainer.find("input:checked").each(function () {
        var key = $(this).attr("name");
        if (key && datasets[key]) {
          data.push(datasets[key]);
        }
      });

      if (data.length > 0) {
        $.plot("#histogram_placeholder", data, {
          yaxis: {
            min: 0,
            max: 125
          },
          xaxis: {
            ticks: [[0, 0], [1, 1.1], [2, 1.2], [3, 2.1], [4, 3.1], [5, 4.1], 
            [6, 4.2], [7, 5.1], [8, 5.2], [9, 5.3]]
          }
        });
      }
    }

    plotAccordingToChoices();
  }

  function createPieChart(){
    var data = [
     { label: "80-100",  data: 20},
     { label: "60-80",  data: 60},
     { label: "40-60",  data: 40},
     { label: "20-40",  data: 30},
     { label: "0-20",  data: 15}
    ];
    
    function labelFormatter(label, series) {
      return "<div style='font-size:12px; text-align:center; padding:2px; color:black;'>" 
      + label + "<br/>" + Math.round(series.percent) + "%</div>";
    }

    var placeholder = $("#pie_placeholder");
    $.plot(placeholder, data, {
      series: {
        pie: { 
          show: true,
          radius: 1,
            label: {
              show: true,
              radius: 2/3,
              formatter: labelFormatter,
              background: {
                opacity: 0
              }
            }
        }
      },
      grid: {
        hoverable: true
      },
      legend: {
        show: false
      }
    });
  }

  createHistogram();
  createPieChart();
});