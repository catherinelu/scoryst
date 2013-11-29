$(document).ready(function() {
  var recreate_url = "/static/json/create-exam.json";
  makeAjaxCall(recreate_url, recreateExamUI, alert, false);
});

function recreateExamUI(data) {
  var rubricsJSON = data;
  for (var i = 0; i < rubricsJSON.length; i++) {
    for (var j = 0; j < rubricsJSON[i].length; j++) {
      var $partInputs = 
        $questionList.find('input[data-question="' + (i + 1) +
                            '"][data-part="' + (j + 1) + '"]');
      $partInputs.eq(0).val(rubricsJSON[i][j].points);
      $partInputs.eq(1).val(rubricsJSON[i][j].pages);

      var $next = $partInputs.parent().parent().parent().next();
      for (var k = 0; k < rubricsJSON[i][j].rubrics.length; k++) {
        $partInputs = $next.find('input');
        var rubric = rubricsJSON[i][j].rubrics[k];
        $partInputs.eq(0).val(rubric.description);
        $partInputs.eq(1).val(rubric.points);

        if (k != rubricsJSON[i][j].rubrics.length - 1) {
          $addRubric.click();
          $next = $next.next();
        }
      }
      if (j != rubricsJSON[i].length - 1) {
        $addPart.click();
      }
    }
    if (i != rubricsJSON.length - 1) {
      $addQuestion.click();
    }
  }
}

function makeAjaxCall(url, successFn, failureFn, isAjax) {
  $.ajax({
    type: "get",
    url: url,
    ajax: isAjax !== undefined ? isAjax : true,
    dataType: "json",
    error: function(request, error) {
      if (failureFn) {
        failureFn (error);
      } else {
        alert (error);
      }
    },
    success: function(jsonResponse) {
      successFn (jsonResponse);
    }
  });
}