$(function() {

  // TODO: These variables are already in create-exam.js
  // Do we really need them declared again?
  var $addQuestion; 
  var $questionList;

  // Recreates the UI for create-exam.html
  window.recreateExamUI = function(questions) {
    $addQuestion = $('.add-question');
    $questionList = $('.question-list');

    if (!questions) {
      return;
    } 

    for (var i = 0; i < questions.length; i++) {
      // Recreate UI for each question and then click on add Question to go create
      // the UI for the next question
      recreateQuestionUI(questions[i], i);
      if (i != questions.length - 1) {
        $addQuestion.click();
      }
    }
  }

  // For the given question, loop over its parts and recreate the UI for them
  function recreateQuestionUI(question, questionIndex) {
    for (var j = 0; j < question.length; j++) {
      // Find all the input boxes associated with the current part
      // These will get us the 'points' and 'pages' fields
      var $partInputs = 
        $questionList.find('input[data-question="' + (questionIndex + 1) +
                            '"][data-part="' + (j + 1) + '"]');
      // Retrieve the points and pages associated with the current part
      var points = isNaN(question[j].points) ? '' : question[j].points;
      var pages = question[j].pages[0] ? question[j].pages : '';
      
      // Update the UI with the values
      $partInputs.eq(0).val(points);
      $partInputs.eq(1).val(pages);

      recreateRubrics(question[j].rubrics, $partInputs, questionIndex, j);

      // Only click on add part if there are more rubrics to be added
      if (j != question.length - 1) {
        $questionList.children().eq(questionIndex).find('.add-part').click()
      }
    }
  }

  // Loop over the rubrics input list. Every even element represents the
  // description of the rubric and every odd element is the points corresponding
  // to that rubric.
  function recreateRubrics(rubrics, $partInputs, questionIndex, partIndex) {
    for (var k = 0; k < rubrics.length; k++) {

      // Ugly DOM traversal needed to reach the rubrics input list
      // Note that this needs to be done inside the loop since the list
      // size increases every time add rubric is clicked
      $rubricInputs = $partInputs.parent().parent().next().find('input');
      
      var rubric = rubrics[k];
      $rubricInputs.eq(2 * k).val(rubric.description);
      
      var points = isNaN(rubric.points) ? '' : rubric.points;
      $rubricInputs.eq(2 * k + 1).val(points);

      // Only click on add rubric if there are more rubrics to be added
      if (k != rubrics.length - 1) {
        $questionList.children().eq(questionIndex).find('.add-rubric').eq(partIndex).click();
      }
    }
  }

});
