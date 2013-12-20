$(function() {
  var $previousStudent = $('.previous-student');
  var $nextStudent = $('.next-student');
  var $rubricsList = $('.grading-rubric');

  $(document).keydown(function(event) {
    var $target = $(event.target);
    if ($target.is('input') || $target.is('textarea')) {
      return;
    }

    // Up Arrow Key: Go to previous student (last name alphabetical order)
    // TODO: triple equals
    if (event.keyCode == 38) {
      $previousStudent.click();
      return false;
    }

    // Down Arrow Key: Go to next student (last name alphabetical order)
    // TODO: triple equals
    if (event.keyCode == 40) {
      $nextStudent.click();
      return false;
    }

    // keyCode for 'a' or 'A' is 65. Select a rubric, if possible.
    var rubricNum = event.keyCode - 65;
    // TODO: use jQuery eq() function, and check rubric.length !== 0
    var rubric = $('.grading-rubric li')[rubricNum];
    if (rubric !== undefined) {
      rubric.click();
    }
  });

  $rubricsList.click(function(event) {
    var $target = $(event.target);
    // User chose a rubric
    if ($target.is('button')) {
      saveComment();
    } else {
      // TODO: add blank lines for readability
      // TODO: don't do 1 line if statements like this. use braces
      if ($target.is('a')) $target = $target.parent();
      if ($target.is('div')) $target = $target.parent();
      if (!$target.is('li')) return;
      var rubricNum = $target.children().children().attr('data-rubric');
      $target.toggleClass('selected');
      var addOrDelete = ($target.hasClass('selected') ? 'add' : 'delete');
      $.ajax({
        url: 'save-graded-rubric/' + curQuestionNum + '/' + curPartNum + '/' 
          // TODO: if you're continuing an expression, put operator on preceeding line
          // the plus at the beginning of the line below should go at the end of the line above
          + rubricNum + '/' + addOrDelete,
      }).done(function() {
        renderExamNav();
        renderRubricNav();
      }).fail(function(request, error) {
        console.log('Error while attempting to save rubric update: ' + error);
      });
    }
  });

  // TODO: don't include event parameter unless you're using it
  $previousStudent.click(function(event) {
    // TODO: no need for intermediate url variable
    var url = 'previous-student/' + curQuestionNum + '/' + curPartNum;
    window.location = url;
  });

  // TODO: don't include event parameter unless you're using it
  $nextStudent.click(function(event) {
    // TODO: no need for intermediate url variable
    var url = 'next-student/' + curQuestionNum + '/' + curPartNum;
    window.location = url;
  });

  // TODO: docs
  function saveComment() {
    // TODO: add blank lines for readability
    var $commentTextarea = $('.comment-textarea');
    var $saveEditComment = $('.comment-save-edit');
    var disabled = $commentTextarea.prop('disabled');
    if (disabled) {  // Comment already exists and the user wants to edit it.
      $saveEditComment.html('Save comment');      
      $commentTextarea.prop('disabled', !disabled);
    } else if ($commentTextarea.val() !== '') { // Comment must be saved.
      $.ajax({
        url: 'save-comment/' + curQuestionNum + '/' + curPartNum,
        // TODO: spaces after { and before }
        // TODO: extra comma at the end
        data: {'comment' : $('.comment-textarea').val()},
      }).done(function() {
        $saveEditComment.html('Edit comment');
      }).fail(function(request, error) {
        console.log('Error while attempting to save comment: ' + error);
      });
      // TODO: indentation
    $commentTextarea.prop('disabled', !disabled);
    }
  }
});
