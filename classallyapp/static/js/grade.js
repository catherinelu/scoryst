$(function() {
  var $previousStudent = $('.previous-student');
  var $nextStudent = $('.next-student');
  var $rubricsList = $('.grading-rubric');

  var timeoutReference;

  function getCsrfToken() {
    var cookieIsRaw = $.cookie.raw;
    // Set the cookie settings to raw, in order to get the csrf token.
    $.cookie.raw = true;
    // Get the csrf token.
    var csrfToken = $.cookie('csrftoken');
    // Reset the cookie raw settings.
    $.cookie.raw = cookieIsRaw;
    return csrfToken;
  }

  function saveCustomRubric() {
    // If the custom rubric is already selected, the custom points for the
    // graded rubric should be modified.
    if($('.grading-rubric input').parents().hasClass('selected')) {
      var customPoints = $('.grading-rubric input').val();
      var customRubricId = $('.grading-rubric input').attr('data-rubric');

      $.ajax({
        type: 'POST',
        url: 'modify-custom-rubric/',
        data: {'customPoints': customPoints, 'customRubricId': customRubricId,
          'csrfmiddlewaretoken': getCsrfToken() }
      }).done(function() {
        renderExamNav(toggleExamNav);
        renderRubricNav();
      }).fail(function(request, error) {
        console.log('Failed to modify an existing graded rubric: ' + error);
      });
    } else {
      $('.grading-rubric input').parent().click();
    }
  }

  $(document).keydown(function(event) {
    var $target = $(event.target);
    if ($target.is('textarea')) {
      return;
    }

    if ($target.is('input')) {
      if (timeoutReference) {
        clearTimeout(timeoutReference);
      }
      timeoutReference = setTimeout(function() {
        saveCustomRubric();
      }, 1000);
      console.log('Set timeout');
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

  $('.grading-rubric input').blur(function() {
    clearTimeout(timeoutReference);
    saveCustomRubric();
  });

  $rubricsList.click(function(event) {
    var $target = $(event.target);

    // Check to see if clicked target is the save comment button.
    if ($target.is('button')) {
      saveComment();
    }

    // Check to see if the clicked target is a rubric.
    else {
      if ($target.is('span')) {
        $target = $target.parent();
      }

      if ($target.is('a')) {
        $target = $target.parent();
      }

      if ($target.is('div')) {
        $target = $target.parent();
      }

      // If the clicked target one of the rubrics, or if the target is the
      // custom rubric but the value inputted is not valid, do nothing.
      if (!$target.is('li') || ($target.find('input').length > 0 &&
        isNaN($target.find('input').val()))) {
        return;
      }

      // Get the rubric number, the custom points, and the custom rubric ID.
      // Either the rubric number is valid, or the custom points and custom
      // rubric ID are valid.
      var rubricNum = $target.children().children().attr('data-rubric');
      var customPoints = $target.find('input').val();
      var customRubricId = $target.find('input').attr('data-rubric');
      if (!customPoints) {
        customPoints = '';
      }

      // This registers that the rubric has been locally saved, but not
      // necessarily saved in the database.
      $target.addClass('local-save');
      // Parameter to tell server whether the rubric should be added or deleted.
      var addOrDelete = ($target.hasClass('selected') ? 'delete' : 'add');

      $.ajax({
        type: 'POST',
        url: 'save-graded-rubric/',
        data: {'curQuestionNum': curQuestionNum, 'curPartNum': curPartNum,
          'rubricNum': rubricNum, 'addOrDelete': addOrDelete,
          'customPoints': customPoints, 'customRubricId': customRubricId,
          'csrfmiddlewaretoken': getCsrfToken() }
      }).done(function() {
        renderExamNav(toggleExamNav);
        renderRubricNav();
      }).fail(function(request, error) {
        console.log('Error while attempting to save rubric update: ' + error);
      });
    }
  });

  $previousStudent.click(function() {
    // Cookies expire after 1 day
    $.cookie('curQuestionNum', curQuestionNum, { expires: 1, path: '/' });
    $.cookie('curPartNum', curPartNum, { expires: 1, path: '/' });
    window.location = 'get-previous-student/';
  });

  $nextStudent.click(function() {
    // Cookies expire after 1 day
    $.cookie('curQuestionNum', curQuestionNum, { expires: 1, path: '/' });
    $.cookie('curPartNum', curPartNum, { expires: 1, path: '/' });
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
      // Toggle the disabled property.
      $commentTextarea.prop('disabled', !disabled);
    }

    // Comment must be saved.
    else if ($commentTextarea.val() !== '') {
      $.ajax({
        type: 'POST',
        url: 'save-comment/',
        data: { 'comment' : $('.comment-textarea').val(),
          'curQuestionNum': curQuestionNum, 'curPartNum': curPartNum,
          'csrfmiddlewaretoken': getCsrfToken() }
      }).done(function() {
        $saveEditComment.html('Edit comment');
        console.log('Changed to edit comment.');
      }).fail(function(request, error) {
        console.log('Error while attempting to save comment: ' + error);
      });
      // Toggle the disabled property.
      $commentTextarea.prop('disabled', !disabled);
    }
  }
});
