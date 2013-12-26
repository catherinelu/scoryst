// TODO(cglu): Please remove all your extraneous console.logs
var $examNavTemplate = $('.exam-nav-template');
var $rubricsNavTemplate = $('.rubrics-nav-template');

var templates = {
  renderExamNavTemplate: Handlebars.compile($examNavTemplate.html()),
  renderRubricsNavTemplate: Handlebars.compile($rubricsNavTemplate.html())
};

var $examNav = $('.grade .question-nav');

/* Get JSON data back to render the exam navigation. */
function renderExamNav(callback) {
  $.ajax({
    url: 'get-exam-summary/' + curQuestionNum + '/' + curPartNum,
    dataType: 'json'
  }).done(function(data) {
    $('.well.question-nav').html(templates.renderExamNavTemplate(data));
    if ($.cookie('examNavIsOpen', Boolean) &&
      $('.grade .question-nav ul').css('display') == 'none') {
      console.log('Toggling exam nav.');
      callback();
    }
  }).fail(function(request, error) {
    console.log('Error while getting exam nav data: ' + error);
  });
}


// Get JSON data back to render the rubrics navigation.
function renderRubricNav() {
  $.ajax({
    url: 'get-rubrics/' + curQuestionNum + '/' + curPartNum,
    dataType: 'json'
  }).done(function(data) {
    $('.well.grading-rubric').html(templates.renderRubricsNavTemplate(data));
  }).fail(function(request, error) {
    console.log('Error while getting rubrics nav data: ' + error);
  });
}


// Show or hide the exam navigation.
function toggleExamNav() {
  if ($('.grade .question-nav ul').css('display') == 'none') {
    $('.grade .question-nav ul').show();
    $('.grade .question-nav i').attr('class', 'fa fa-minus-circle fa-lg');
    $.cookie('examNavIsOpen', true, { expires: 1, path: '/' });  // Expires after 1 day
    console.log('Setting examNavIsOpen to true');
  } else {
    $('.grade .question-nav ul').hide();
    $('.grade .question-nav i').attr('class', 'fa fa-plus-circle fa-lg');
    $.cookie('examNavIsOpen', false, { expires: 1, path: '/' });  // Expires after 1 day
    console.log('Setting examNavIsOpen to false');
  }
}

var curQuestionNum;
var curPartNum;

if ($.cookie('examNavIsOpen') === undefined) {
  $.cookie('examNavIsOpen', false, { expires: 1, path: '/' });  // Expires after 1 day
}

$(function() {

  // Functions:
  // ----------

  function getQuestionPartIndex() {
    $questionParts = $('.question-nav li');
    temp = $questionParts;
    var index = -1;
    for (var i = 0; i < $questionParts.length; i++) {
      console.log('here');
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

  function setQuestionPart(questionNum, partNum) {
    curQuestionNum = questionNum;
    curPartNum = partNum;
    $.cookie('curQuestionNum', questionNum, { expires: 1, path: '/' });
    $.cookie('curPartNum', partNum, { expires: 1, path: '/' });
  }

  // Updates the displayed exam page, based on the current question and part.
  function updateExamView() {
    var questionPartIndex = getQuestionPartIndex();
    console.log(curQuestionNum + ' ' + curPartNum);
    console.log(questionPartIndex);
    // TODO: What if length 0?
    imageLoader.showPage(examPageMappings[questionPartIndex][0], curQuestionNum, curPartNum);
  }


  // Setting up the initial state:
  // -----------------------------

  // Get values from cookies, if set.
  curQuestionNum = $.cookie('curQuestionNum', Number);
  curPartNum = $.cookie('curPartNum', Number);
  if (isNaN(curQuestionNum)) {
    setQuestionPart(1, 1);
  }

  // TODO: Do this in a nicer way once our javascript has better modularity
  // Right now, if $('.next-student')[0] is not defined, it means we are either
  // in student view or preview, so we don't want our imageLoader to try and preload
  // previous and next students
  var preloadStudent = false;
  if ($('.next-student')[0]) {
    preloadStudent = true;
  }

  var imageLoader = new ImageLoader(1, true, preloadStudent);
  function setUp() {
    toggleExamNav();
    $.ajax({
      url: 'get-exam-page-mappings',
      async: false
    }).done(function(data) {
      examPageMappings = data;
    }).fail(function() {
      console.log('Failed to get the exam page mappings.');
    });

    updateExamView();
  }

  renderExamNav(setUp);
  renderRubricNav();


  // Clicking the previous page goes to the previous page for the current
  // question and part. If there are no more, it goes to the last page for the
  // previous question and part. If there is no previous question and part, do
  // nothing.
  imageLoader.$previousPage.click(function(){
    if (imageLoader.curPageNum <= 1) return;
    // Get the index of the current question part. Question 1 part 1 would be 0.
    var questionPartIndex = getQuestionPartIndex();
    console.log('Question part index is: ' + questionPartIndex);
    // Iterate over the pages that belong to this question part.
    var prevPage = -1;
    for (var i = 0; i < examPageMappings[questionPartIndex].length; i++) {
      // The previous page was found and belongs to the current question part.
      if (prevPage !== -1 && examPageMappings[questionPartIndex][i] == imageLoader.curPageNum) {
        console.log('Previous page was found: ' + prevPage);
        imageLoader.curPageNum = prevPage;
        imageLoader.showPage(imageLoader.curPageNum, curQuestionNum, curPartNum);
        return;
      }
      prevPage = examPageMappings[questionPartIndex][i];
    }

    // The previous page does not belong to the current question part. Try to go
    // to the last page of the previous question part.
    if (questionPartIndex !== 0) {
      numPages = examPageMappings[questionPartIndex - 1].length;
      // TODO: What if numPages = 0?
      imageLoader.curPageNum = examPageMappings[questionPartIndex - 1][numPages - 1];
      imageLoader.showPage(imageLoader.curPageNum, curQuestionNum, curPartNum);

      // Update the current question and part number. Re-render.
      var previousQuestionPart = getQuestionPart(questionPartIndex - 1);
      setQuestionPart(previousQuestionPart.questionNum, previousQuestionPart.partNum);
      renderExamNav(toggleExamNav);
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
  imageLoader.$nextPage.click(function(){
    if (imageLoader.curPageNum >= imageLoader.numPages) return;

    // Get the index of the current question part. Question 1 part 1 would be 0.
    var questionPartIndex = getQuestionPartIndex();
    console.log('Question part index is: ' + questionPartIndex);
    // Iterate over the pages that belong to this question part.
    var found = false;
    for (var i = 0; i < examPageMappings[questionPartIndex].length; i++) {
      // The current page was found and belongs to the current question part.
      if (found) {
        imageLoader.curPageNum = examPageMappings[questionPartIndex][i];
        imageLoader.showPage(imageLoader.curPageNum, curQuestionNum, curPartNum);
        return;
      }

      if (examPageMappings[questionPartIndex][i] == imageLoader.curPageNum) {
        found = true;
      }
    }

    // The next page does not belong to the current question part. Try to go
    // to the first page of the next question part.
    if (questionPartIndex !== examPageMappings.length - 1) {
      numPages = examPageMappings[questionPartIndex + 1].length;
      // TODO: What if numPages = 0?
      imageLoader.curPageNum = examPageMappings[questionPartIndex + 1][0];
      imageLoader.showPage(imageLoader.curPageNum, curQuestionNum, curPartNum);

      // Update the current question and part number. Re-render.
      var nextQuestionPart = getQuestionPart(questionPartIndex + 1);
      setQuestionPart(nextQuestionPart.questionNum, nextQuestionPart.partNum);
      renderExamNav(toggleExamNav);
      renderRubricNav();
      return;
    }

    // If we reach here, we are on the last page of the last question part, so
    // we cannot go forward a page. Do nothing.
  });

  $(document).keydown(function(event) {
    var $target = $(event.target);
    if ($target.is('input') || $target.is('textarea')) {
      return;
    }


    // Left Arrow Key: Advance the exam
    if (event.keyCode == 37) {
       imageLoader.$previousPage.click();
       return false;
    }

    // Right Arrow Key: Go back a page in the exam
    if (event.keyCode == 39) { 
       imageLoader.$nextPage.click();
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
          setQuestionPart(parseInt($questionParts.eq(i).children().attr('data-question')),
            parseInt($questionParts.eq(i).children().attr('data-part')));
          updateExamView();  // Change exam view for updated question and part.
          renderExamNav(toggleExamNav);
          renderRubricNav();
          return false;
        }
        if ($questionParts.eq(i).hasClass('active')) {
          found = true;
        }
      }
      // If we reach here, the active question part is the last one, so wrap
      // around to the beginning.
      setQuestionPart(1, 1);
      updateExamView();  // Change exam view for updated question and part.
      renderExamNav(toggleExamNav);
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
          setQuestionPart(prevQuestionNum, prevPartNum);
          updateExamView();  // Change exam view for updated question and part.
          renderExamNav(toggleExamNav);
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


  $examNav.on('click', 'ul a', function(event) {
    event.preventDefault();

    var $target = $(event.target);
    var questionNum = parseInt($target.attr('data-question'), 10);
    var partNum = parseInt($target.attr('data-part'), 10);

    $examNav.children('ul').children('li').removeClass('active');
    $target.parent().addClass('active');
    setQuestionPart(questionNum, partNum);

    updateExamView();
    renderRubricNav();
    renderExamNav(toggleExamNav);
  });

  $examNav.on('click', '.toggle-exam-nav', toggleExamNav);
});
