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


  $(document).keydown(function(event) {
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
  // TODO: Fix the click.
  $('.grade .question-nav').on('click', 'a', (function(e) {
    console.log("clicked");
    if ($('.grade .question-nav ul').css('display') == 'none') {
      console.log("display is none");
      $('.grade .question-nav ul').css('display', 'visible');
      $('.grade .question-nav i').attr('class', 'fa fa-minus-circle fa-lg');
    } else {
      console.log("dipslay is not none");
      $('.grade .question-nav ul').css('display', 'none');
      $('.grade .question-nav i').attr('class', 'fa fa-plus-circle fa-lg');
    }
  }));

});