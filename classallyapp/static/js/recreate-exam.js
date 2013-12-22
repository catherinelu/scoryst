// Recreates the UI for create-exam.html
// TODO: explicitly write window.recreateExamUI = ... for a global
recreateExamUI = function(json) {
  // TODO: if !json is the more common way to check this
  if (json === undefined) {
    return;
  } else {
    // TODO: declare variable in the scope you're using it; I know this is hoisted,
    // but it's not immediately obvious to everyone
    var rubricsJSON = json;
  }
  a = json;
  // TODO: These variables are already in create-exam.js
  // Do we really need declared again?
  
  var $addQuestion = $('.add-question');
  var $addPart = $('.add-part');
  var $addRubric = $('.add-rubric');
  var $questionList = $('.question-list');

  // TODO: this code looks ugly. explain it with some inline comments or just
  // generally beautify it
  for (var i = 0; i < rubricsJSON.length; i++) {
    for (var j = 0; j < rubricsJSON[i].length; j++) {
      var $partInputs = 
        $questionList.find('input[data-question="' + (i + 1) +
                            '"][data-part="' + (j + 1) + '"]');
      var points = isNaN(rubricsJSON[i][j].points) ? '' : rubricsJSON[i][j].points;
      var pages = rubricsJSON[i][j].pages[0] ? rubricsJSON[i][j].pages : '';
      $partInputs.eq(0).val(points);
      $partInputs.eq(1).val(pages);

      // TODO: explain this
      // Ugly DOM traversal
      var $next = $partInputs.parent().parent().next();
      for (var k = 0; k < rubricsJSON[i][j].rubrics.length; k++) {
        $partInputs = $next.find('input');
        var rubric = rubricsJSON[i][j].rubrics[k];
        $partInputs.eq(2 * k).val(rubric.description);
        var points = isNaN(rubric.points) ? '' : rubric.points;
        $partInputs.eq(2 * k + 1).val(points);

        if (k != rubricsJSON[i][j].rubrics.length - 1) {
          $questionList.children().eq(i).find('.add-rubric').eq(j).click();
        }
      }
      if (j != rubricsJSON[i].length - 1) {
        $questionList.children().eq(i).find('.add-part').click()
      }
    }
    if (i != rubricsJSON.length - 1) {
      $addQuestion.click();
    }
  }
}
