var $examNavTemplate = $('.exam-nav-template');
var $rubricsNavTemplate = $('.rubrics-nav-template');

var templates = {
  renderExamNavTemplate: Handlebars.compile($examNavTemplate.html()),
  renderRubricsNavTemplate: Handlebars.compile($rubricsNavTemplate.html())
};

/* Get JSON data back to render the exam navigation. */
function renderExamNav() {
  $.ajax({
    url: 'get-exam-summary/' + curQuestionNum + '/' + curPartNum,
    dataType: 'json',
  }).done(function(data) {
    $('.well.question-nav').html(templates.renderExamNavTemplate(data));
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


$(function() {
  var $questionsNav = $('.question-nav');

  renderExamNav();
  renderRubricNav();


  function getQuestionPartIndex() {
    $questionParts = $('.question-nav li');
    var index = -1;
    for (var i = 0; i < $questionParts.length; i++) {
      // Increment index only if the list element is a valid question part.
      if ($questionParts.eq(i).children().is('a')) {
        index++;
      }
      if ($questionParts.eq(i).children().attr('data-question') == curQuestionNum &&
        $questionParts.eq(i).children().attr('data-part') == curPartNum) {
        return index;
      }
    }
    return index;  // Should never reach.
  }

  function getQuestionPart(index) {
    $questionParts = $('.question-nav li');
    var cur_index = -1;
    for (var i = 0; i < $questionParts.length; i++) {
      // Increment index only if the list element is a valid question part.
      if ($questionParts.eq(i).children().is('a')) {
        cur_index++;
      }

      if (index === cur_index) {
        var question_part_to_return = {
          'questionNum': $questionParts.eq(i).children().attr('data-question'),
          'partNum': $questionParts.eq(i).children().attr('data-part')
        };
        return question_part_to_return;
      }
    }
    return {};  // Should never reach.
  }


  $.ajax({
    url: 'get-exam-page-mappings',
    async: false
  }).done(function(data) {
    examPageMappings = data;
  }).fail(function() {
    console.log('Failed to get the exam page mappings.');
  });

  // Updates the displayed exam page, based on the current question and part.
  function updateExamView() {
    var questionPartIndex = getQuestionPartIndex();
    goToPage(examPageMappings[questionPartIndex][0]);  // TODO: What if length 0?
  }



  // Clicking the previous page goes to the previous page for the current
  // question and part. If there are no more, it goes to the last page for the
  // previous question and part. If there is no previous question and part, do
  // nothing.
  $previousPage.click(function(){
    if (curPage <= 1) return;
    // Get the index of the current question part. Question 1 part 1 would be 0.
    var questionPartIndex = getQuestionPartIndex();
    console.log('Question part index is: ' + questionPartIndex);
    // Iterate over the pages that belong to this question part.
    var prevPage = -1;
    for (var i = 0; i < examPageMappings[questionPartIndex].length; i++) {
      // The previous page was found and belongs to the current question part.
      if (prevPage !== -1 && examPageMappings[questionPartIndex][i] == curPage) {
        console.log('Previous page was found: ' + prevPage);
        curPage = prevPage;
        goToPage(curPage);
        return;
      }
      prevPage = examPageMappings[questionPartIndex][i];
    }

    // The previous page does not belong to the current question part. Try to go
    // to the last page of the previous question part.
    if (questionPartIndex !== 0) {
      numPages = examPageMappings[questionPartIndex - 1].length;
      // TODO: What if numPages = 0?
      curPage = examPageMappings[questionPartIndex - 1][numPages - 1];
      goToPage(curPage);

      // Update the current question and part number. Re-render.
      var previousQuestionPart = getQuestionPart(questionPartIndex - 1);
      curQuestionNum = previousQuestionPart.questionNum;
      curPartNum = previousQuestionPart.partNum;
      renderExamNav();
      renderRubricNav();
      return;
    }

    // If we reach here, we are on the first page of the first question part, so
    // we cannot go back a page. Do nothing.
    console.log('On the first page of the first question part.');
  });


  // Clicking the next page goes to the next page for the current question
  // and part. If there are no more, it goes to the first page for the next
  // question and part. If there is no previous question and part, do nothing.
  $nextPage.click(function(){
    if (curPage >= pdfDoc.numPages) return;

    // Get the index of the current question part. Question 1 part 1 would be 0.
    var questionPartIndex = getQuestionPartIndex();
    console.log('Question part index is: ' + questionPartIndex);
    // Iterate over the pages that belong to this question part.
    var found = false;
    for (var i = 0; i < examPageMappings[questionPartIndex].length; i++) {
      // The current page was found and belongs to the current question part.
      if (found) {
        curPage = examPageMappings[questionPartIndex][i];
        goToPage(curPage);
        return;
      }

      if (examPageMappings[questionPartIndex][i] == curPage) {
        found = true;
      }
    }

    // The next page does not belong to the current question part. Try to go
    // to the first page of the next question part.
    if (questionPartIndex !== examPageMappings.length - 1) {
      numPages = examPageMappings[questionPartIndex + 1].length;
      // TODO: What if numPages = 0?
      curPage = examPageMappings[questionPartIndex + 1][0];
      goToPage(curPage);

      // Update the current question and part number. Re-render.
      var nextQuestionPart = getQuestionPart(questionPartIndex + 1);
      curQuestionNum = nextQuestionPart.questionNum;
      curPartNum = nextQuestionPart.partNum;
      renderExamNav();
      renderRubricNav();
      return;
    }

    // If we reach here, we are on the last page of the last question part, so
    // we cannot go forward a page. Do nothing.
  });

  $(document).keydown(function(event) {
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

    // ] Key: Advance a question part. If at the end, wrap around to front.
    if (event.keyCode == 221) {
      $questionParts = $('.question-nav li');
      var found = false;
      for (var i = 0; i < $questionParts.length; i++) {
        // Check if this is the first question part that is found after the 
        // active one:
        if (found && $questionParts.eq(i).children().is('a') > 0) {
          curQuestionNum = $questionParts.eq(i).children().attr('data-question');
          curPartNum = $questionParts.eq(i).children().attr('data-part');
          updateExamView();  // Change exam view for updated question and part.
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
      updateExamView();  // Change exam view for updated question and part.
      renderExamNav();
      renderRubricNav();
      return false;
    }

    // [ Key: Go back a question part. If at front, wrap around to end.
    if (event.keyCode == 219) { 
      $questionParts = $('.question-nav li');
      var prevQuestionNum = 1;
      var prevPartNum = 1;
      var set = false;  // Used so we don't assume anything about question #s
      for (var i = 0; i < $questionParts.length; i++) {
        if ($questionParts.eq(i).hasClass('active')) {
          if (!set) {
            var lastIndex = $questionParts.length - 1;
            prevQuestionNum = $questionParts.eq(lastIndex).children().attr('data-question');
            prevPartNum = $questionParts.eq(lastIndex).children().attr('data-part');
          }
          curQuestionNum = prevQuestionNum;
          curPartNum = prevPartNum;
          updateExamView();  // Change exam view for updated question and part.
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


  /* To toggle the question navigation. */
  $('.grade .question-nav').on('click', 'a', (function(e) {
    console.log("clicked");
    if ($('.grade .question-nav ul').css('display') == 'none') {
      console.log("display is none");
      $('.grade .question-nav ul').show();
      $('.grade .question-nav i').attr('class', 'fa fa-minus-circle fa-lg');
    } else {
      console.log("dipslay is not none");
      $('.grade .question-nav ul').hide();
      $('.grade .question-nav i').attr('class', 'fa fa-plus-circle fa-lg');
    }
  }));

});