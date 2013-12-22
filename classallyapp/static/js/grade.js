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
    if (event.keyCode === 38) {
      $previousStudent.click();
      return false;
    }

    // Down Arrow Key: Go to next student (last name alphabetical order)
    if (event.keyCode === 40) {
      $nextStudent.click();
      return false;
    }

    // keyCode for 'a' or 'A' is 65. Select a rubric, if possible.
    var rubricNum = event.keyCode - 65;
    var $rubric = $('.grading-rubric li').eq(rubricNum);
    if ($rubric.length !== 0) {
      $rubric.click();
    }
  });

  $rubricsList.click(function(event) {
    var $target = $(event.target);
    // User chose a rubric
    if ($target.is('button')) {
      saveComment();
    } else {
      if ($target.is('span')) {
        $target = $target.parent();
      }

      if ($target.is('a')) {
        $target = $target.parent();
      }

      if ($target.is('div')) {
        $target = $target.parent();
      }

      if (!$target.is('li')) {
        return;
      }

      var rubricNum = $target.children().children().attr('data-rubric');
      var customPoints = $target.children('input').attr('value');
      $target.toggleClass('selected');
      var addOrDelete = ($target.hasClass('selected') ? 'add' : 'delete');
      $.ajax({
        url: 'save-graded-rubric/' + curQuestionNum + '/' + curPartNum + '/' +
          rubricNum + '/' + addOrDelete + '/' + customPoints,
      }).done(function() {
        renderExamNav(toggleExamNav);
        renderRubricNav();
      }).fail(function(request, error) {
        console.log('Error while attempting to save rubric update: ' + error);
      });
    }
  });

  $previousStudent.click(function() {
    $.cookie('curQuestionNum', curQuestionNum, { expires: 1 });
    $.cookie('curPartNum', curPartNum, { expires: 1 });
    window.location = 'get-previous-student/';
  });

  $nextStudent.click(function() {
    $.cookie('curQuestionNum', curQuestionNum, { expires: 1 });
    $.cookie('curPartNum', curPartNum, { expires: 1 });
    window.location = 'get-next-student/';
  });

  // Saves or updates a comment.
  function saveComment() {
    var $commentTextarea = $('.comment-textarea');
    var $saveEditComment = $('.comment-save-edit');
    var disabled = $commentTextarea.prop('disabled');

    // Comment already exists and the user wants to edit it.
    if (disabled) {
      $saveEditComment.html('Save comment');      
    }

    // Comment must be saved.
    else if ($commentTextarea.val() !== '') {
      $.ajax({
        url: 'save-comment/' + curQuestionNum + '/' + curPartNum,
        data: { 'comment' : $('.comment-textarea').val() }
      }).done(function() {
        $saveEditComment.html('Edit comment');
      }).fail(function(request, error) {
        console.log('Error while attempting to save comment: ' + error);
      });
    }

    // Toggle the disabled property.
    $commentTextarea.prop('disabled', !disabled);
  }
});
