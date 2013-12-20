$(function() {
  // Copied the PDF code from create-exam.html
  var PDF_SCALE = 1.3;
  var $canvas = $('.exam-canvas canvas');
  var context = $canvas[0].getContext('2d');

  var $previousPage = $('.previous-page');
  var $nextPage = $('.next-page');
  var $previousStudent = $('.previous-student');
  var $nextStudent = $('.next-student');

  var $questionsNav = $('.question-nav');
  var $rubricsList = $('.grading-rubric');

  var $examNavTemplate = $('.exam-nav-template');
  var $rubricsNavTemplate = $('.rubrics-nav-template');

  var templates = {
    renderExamNavTemplate: Handlebars.compile($examNavTemplate.html()),
    renderRubricsNavTemplate: Handlebars.compile($rubricsNavTemplate.html())
  };

  var url = '/static/pdf/empty-cs221.pdf';
  var pdfDoc = null;
  var currPage = 1;

  var curQuestionNum = GetURLParameter('q');
  var curPartNum = GetURLParameter('p');
  if (curQuestionNum === undefined) {
    curQuestionNum = 1;
    curPartNum = 1;
  }

  function GetURLParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
      var sParameterName = sURLVariables[i].split('=');
      if (sParameterName[0] == sParam) {
        return sParameterName[1];
      }
    }
  }

  /* Resizes the page navigation to match the canvas height. */
  function resizePageNavigation() {
    $previousPage.height($canvas.height());
    $nextPage.height($canvas.height());
  }

  $(window).resize(resizePageNavigation);

  /* Get page info, resize canvas accordingly, and render PDF page. */
  function renderPDFPage(num) {
    pdfDoc.getPage(num).then(function(page) {
      var viewport = page.getViewport(PDF_SCALE);
      $canvas.prop('height', viewport.height);
      $canvas.prop('width', viewport.width);

      // Render PDF page into canvas context
      var renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      page.render(renderContext).then(function() {
        resizeNav();
        resizePageNavigation();
      });
    });
  }

  $(document).ready(function() {
    PDFJS.disableWorker = true;
    PDFJS.getDocument(url).then(
      function getPdf(_pdfDoc) {
        pdfDoc = _pdfDoc;
        renderPDFPage(currPage);
      },
      function getPdfError(message, exception) {
        // TODO:
        alert(message);
      }
    );

    renderExamNav();
    renderRubricNav();
  });

  function goToPage(num) {
    if (num < 1 || num > pdfDoc.numPages) return;
    currPage = num;
    renderPDFPage(currPage);
  }

  $previousPage.click(function(){
    if (currPage <= 1) return;
    currPage--;
    goToPage(currPage);
  });

  $nextPage.click(function(){
    if (currPage >= pdfDoc.numPages) return;
    currPage++;
    goToPage(currPage);
  });

  $(document).keydown(function(event) {
    var $target = $(event.target);
    if ($target.is('input') || $target.is('textarea')) {
      return;
    }

    // Left Arrow Key: Advance the exam
    if (event.keyCode == 37) { 
       $previousPage.click();
       return false;
    }

    // Right Arrow Key: Go back a page in the exam
    if (event.keyCode == 39) { 
       $nextPage.click();
       return false;
    }

    // Up Arrow Key: Go to previous student (last name alphabetical order)
    if (event.keyCode == 38) {
      $previousStudent.click();
      return false;
    }

    // Down Arrow Key: Go to next student (last name alphabetical order)
    if (event.keyCode == 40) {
      $nextStudent.click();
      return false;
    }

    // ] Key: Advance a question part. If at the end, wrap around to front.
    if (event.keyCode == 221) {
      $questionParts = $('.question-nav li');
      var found = false;
      for (var i = 0; i < $questionParts.length; i++) {
        // Check if this is the first question part that is found after the 
        // active one:
        if (found && $questionParts.eq(i).children().length > 0) {
          curQuestionNum = $questionParts.eq(i).children().attr('data-question');
          curPartNum = $questionParts.eq(i).children().attr('data-part');
          renderExamNav();
          renderRubricNav();
          return false;
        }
        if ($questionParts.eq(i).hasClass('active')) {
          found = true;
        }
      }
      // If we reach here, the active question part is the last one, so wrap
      // around to the beginning.
      curQuestionNum = 1;
      curPartNum = 1;
      renderExamNav();
      renderRubricNav();
      return false;
    }

    // [ Key: Go back a question part. If at front, wrap around to end.
    if (event.keyCode == 219) { 
      console.log('Pressed [');
      $questionParts = $('.question-nav li');
      var prevQuestionNum = 1;
      var prevPartNum = 1;
      var set = false;  // Used so we don't assume anything about question #s
      for (var i = 0; i < $questionParts.length; i++) {
        if ($questionParts.eq(i).hasClass('active')) {
          console.log('Found active');
          if (!set) {
            var lastIndex = $questionParts.length - 1;
            prevQuestionNum = $questionParts.eq(lastIndex).children().attr('data-question');
            prevPartNum = $questionParts.eq(lastIndex).children().attr('data-part');
          }
          curQuestionNum = prevQuestionNum;
          curPartNum = prevPartNum;
          renderExamNav();
          renderRubricNav();
          return false;
        } else if ($questionParts.eq(i).children().is('a')) { 
          prevQuestionNum = $questionParts.eq(i).children().attr('data-question');
          prevPartNum = $questionParts.eq(i).children().attr('data-part');
          set = true;
        }
      }
      console.log('Error: could not find active class.');
      return false;  // Should never reach here.
    }

      // keyCode for 'a' or 'A' is 65. Select a rubric, if possible.
      var rubricNum = event.keyCode - 65;
      var rubric = $('.grading-rubric li')[rubricNum];
      if (rubric !== undefined) {
        rubric.click();
      }

  });

  /* To toggle the question navigation. */
  $('.grade .question-nav > a').click(function() {
    if ($('.grade .question-nav ul').css('display') == 'none') {
      $('.grade .question-nav ul').css('display', 'inherit');   
      $('.grade .question-nav i').attr('class', 'fa fa-minus-circle fa-lg');
    } else {
      $('.grade .question-nav ul').css('display', 'none');
      $('.grade .question-nav i').attr('class', 'fa fa-plus-circle fa-lg');
    }
  });

  /* Get JSON data back to render the exam navigation. */
  function renderExamNav() {
    $.ajax({
      url: 'get-exam-summary/' + curQuestionNum + '/' + curPartNum,
      dataType: 'json',
    }).done(function(data) {
      $('.well.question-nav').children('ul').html(templates.renderExamNavTemplate(data));
    }).fail(function(request, error) {
      console.log('Error while getting exam nav data: ' + error);
    });
  }

  /* Get JSON data back to render the rubrics navigation. */
  function renderRubricNav() {
    $.ajax({
      url: 'get-rubrics/' + curQuestionNum + '/' + curPartNum,
      dataType: 'json',
    }).done(function(data) {
      $('.well.grading-rubric').html(templates.renderRubricsNavTemplate(data));
    }).fail(function(request, error) {
      console.log('Error while getting rubrics nav data: ' + error);
    });
  }

  $rubricsList.click(function(event) {
    var $target = $(event.target);
    // User chose a rubric
    if ($target.is('button')) {
      saveComment();
    } else {
      if ($target.is('a')) $target = $target.parent();
      if ($target.is('div')) $target = $target.parent();
      if (!$target.is('li')) return;
      var rubricNum = $target.children().children().attr('data-rubric');
      $target.toggleClass('selected');
      var addOrDelete = ($target.hasClass('selected') ? 'add' : 'delete');
      $.ajax({
        url: 'save-graded-rubric/' + curQuestionNum + '/' + curPartNum + '/' 
          + rubricNum + '/' + addOrDelete,
      }).done(function() {
        renderExamNav();
        renderRubricNav();
      }).fail(function(request, error) {
        console.log('Error while attempting to save rubric update: ' + error);
      });
    }
  });

  $questionsNav.children('ul').click(function(event) {
    var $target = $(event.target);
    if (!$target.is('a')) return;
    $questionsNav.children('ul').children('li').removeClass('active');
    $target.parent().addClass('active');
    curQuestionNum = parseInt($target.attr('data-question'), 10);
    curPartNum = parseInt($target.attr('data-part'), 10);
    renderRubricNav();
    renderExamNav();
  });

  $previousStudent.click(function(event) {
    var url = 'previous-student/' + curQuestionNum + '/' + curPartNum;
    window.location = url;
  });

  $nextStudent.click(function(event) {
    var url = 'next-student/' + curQuestionNum + '/' + curPartNum;
    window.location = url;
  });

  function saveComment() {
    var $commentTextarea = $('.comment-textarea');
    var $saveEditComment = $('.comment-save-edit');
    var disabled = $commentTextarea.prop('disabled');
    if (disabled) {  // Comment already exists and the user wants to edit it.
      $saveEditComment.html('Save comment');      
      $commentTextarea.prop('disabled', !disabled);
    } else if ($commentTextarea.val() !== '') { // Comment must be saved.
      $.ajax({
        url: 'save-comment/' + curQuestionNum + '/' + curPartNum,
        data: {'comment' : $('.comment-textarea').val()},
      }).done(function() {
        $saveEditComment.html('Edit comment');
      }).fail(function(request, error) {
        console.log('Error while attempting to save comment: ' + error);
      });
    $commentTextarea.prop('disabled', !disabled);
    }
  }
});
