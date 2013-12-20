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
    // TODO: use jQuery eq() function, and check rubric.length !== 0.
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
      $target.toggleClass('selected');
      var addOrDelete = ($target.hasClass('selected') ? 'add' : 'delete');
      $.ajax({
        url: 'save-graded-rubric/' + curQuestionNum + '/' + curPartNum + '/' +
          rubricNum + '/' + addOrDelete,
      }).done(function() {
        renderExamNav();
        renderRubricNav();
      }).fail(function(request, error) {
        console.log('Error while attempting to save rubric update: ' + error);
      });
    }
  });

  $previousStudent.click(function() {
    window.location = 'previous-student/' + curQuestionNum + '/' + curPartNum;
  });

  $nextStudent.click(function() {
    window.location = 'next-student/' + curQuestionNum + '/' + curPartNum;
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
