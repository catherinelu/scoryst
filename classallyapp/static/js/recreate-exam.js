// Recreates the UI for create-exam.html
recreateExamUI = function(json) {
  if (json === undefined) {
    return;
  } else {
    var rubricsJSON = json;
  }
  
  // TODO: These variables are already in create-exam.js
  // Do we really need declared again?
  
  var $addQuestion = $('.add-question');
  var $addPart = $('.add-part');
  var $addRubric = $('.add-rubric');
  var $questionList = $('.question-list');

  for (var i = 0; i < rubricsJSON.length; i++) {
    for (var j = 0; j < rubricsJSON[i].length; j++) {
      var $partInputs = 
        $questionList.find('input[data-question="' + (i + 1) +
                            '"][data-part="' + (j + 1) + '"]');
      var points = isNaN(rubricsJSON[i][j].points) ? "" : rubricsJSON[i][j].points;
      var pages = isNaN(rubricsJSON[i][j].pages) ? "" : rubricsJSON[i][j].pages;
      $partInputs.eq(0).val(points);
      $partInputs.eq(1).val(pages);

      // Ugly DOM traversal
      var $next = $partInputs.parent().parent().parent().next();
      for (var k = 0; k < rubricsJSON[i][j].rubrics.length; k++) {
        $partInputs = $next.find('input');
        var rubric = rubricsJSON[i][j].rubrics[k];
        $partInputs.eq(0).val(rubric.description);
        var points = isNaN(rubric.points) ? "" : rubric.points;
        $partInputs.eq(1).val(points);

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