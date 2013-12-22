// TODO: anonymous wrapper
// TODO: give some general section headers
// i.e. // DOM elements
//      // Handlebars templates
//      etc...
var $addQuestion = $('.add-question');
var $questionList = $('.question-list');
var $doneRubric = $('.done-rubric');

var $questionTemplate = $('.question-template');
var $partTemplate = $('.part-template');
var $rubricTemplate = $('.rubric-template');

var templates = {
  renderQuestionTemplate: Handlebars.compile($questionTemplate.html()),
  renderPartTemplate: Handlebars.compile($partTemplate.html()),
  renderRubricTemplate: Handlebars.compile($rubricTemplate.html())
};

var lastQuestionNum = 0;

// Globals we get from classLumoUI.js: pdfDoc, pageNum

$(document).ready(function() {
  // Init the Rubric display UI
  $addQuestion.click();
  $.ajax({
    url: window.location.pathname + 'recreate-exam',
    // TODO: extra comma
    dataType: 'json',
  }).done(function(json) {
    recreateExamUI(json);
  }).fail(function(request, error) {
    console.log(error);
  });
});

// handle adding parts
$questionList.click(function(event) {
  var $target = $(event.target);
  var $targetAndParents = $target.parents().addBack();
  var $addPart = $targetAndParents.filter('.add-part').eq(0);

  // event delegation on .add-part button
  if ($addPart.length !== 0) {
    // TODO: explain what you're doing
    event.preventDefault();

    var $ul = $addPart.siblings('ul');
    var templateData = {
      questionNum: parseInt($addPart.data().question, 10),
      partNum: $ul.children('li').length + 1
    };

    $ul.append(templates.renderPartTemplate(templateData));
    $ul.find('.add-rubric:last').click();

    // ensure readonly inputs are never focused
    $ul.children('li:last').find('input[readonly]').focus(function() {
      $(this).blur();
    });
    resizeNav();
  }
});

// handle adding rubrics
$questionList.click(function(event) {
  var $target = $(event.target);
  var $targetAndParents = $target.parents().addBack();
  var $addRubric = $targetAndParents.filter('.add-rubric').eq(0);

  // event delegation on .add-rubric button
  if ($addRubric.length !== 0) {
    event.preventDefault();

    var $ul = $addRubric.siblings('ul');
    $ul.append(templates.renderRubricTemplate());
    resizeNav();
  }
});

// handle expanding/contracting questions/parts
$questionList.click(function(event) {
  var $target = $(event.target);

  // clicks on h3/h4 should also expand/contract questions/parts
  if ($target.is('h3') || $target.is('h4')) {
    $target = $target.children('i:first');
  }

  var isArrowDown = $target.is('.fa-chevron-circle-down');
  var isArrowUp = $target.is('.fa-chevron-circle-up');

  if (isArrowDown || isArrowUp) {
    event.preventDefault();
    var $body = $target.parent().siblings('.question-body, .part-body'); 

    // change icon and show/hide body
    if (isArrowDown) {
      $target.removeClass('fa-chevron-circle-down')
        .addClass('fa-chevron-circle-up');
      $body.hide();
    } else if (isArrowUp) {
      $target.removeClass('fa-chevron-circle-up')
        .addClass('fa-chevron-circle-down');
      $body.show();
    }

    resizeNav();
  }
});

$questionList.click(function(event) {
  // TODO: explain
  // event delegation on trash icon
  var $target = $(event.target);
  if ($target.is('.fa-trash-o')) {
    var $li = $target.parents('li').eq(0);
    var questionNum = parseInt($li.data('question'), 10);

    // TODO: bad variable name with json
    var questionsJson = createQuestionsJson();

    if (questionNum) {
      // user is trying to remove a question
      questionsJson.splice(questionNum - 1, 1);
    } else {
      // user is trying to remove a part
      var partNum = parseInt($li.data('part'), 10);
      questionNum = $li.parents('li').eq(0).data('question');

      questionNum = parseInt(questionNum, 10);
      questionsJson[questionNum - 1].splice(partNum - 1, 1);
    }

    lastQuestionNum = 0;
    $questionList.html('');
    $addQuestion.click();
    recreateExamUI(questionsJson);
  }
});

/* Show the active question and part; hide everything else. */
function showActiveQuestionAndPart() {
  // hide everything
  $questionList.find('ul').hide();
  $questionList.find('i').show();

  // show current question; hide plus button
  var $activeQuestion = getCurrentQuestion();
  $activeQuestion
    .children('ul')
    .show();

  $activeQuestion
    .children('h3')
    .children('i')
    .hide();

  // show current part; hide plus button
  var $activePart = getCurrentPart();
  $activePart
    .children('ul')
    .show();

  $activePart
    .children('h4')
    .children('i')
    .hide();
}

$addQuestion.click(function(event) {
  event.preventDefault();
  lastQuestionNum++;

  var templateData = { questionNum: lastQuestionNum };
  $questionList.append(templates.renderQuestionTemplate(templateData));

  $questionList.find('.add-part:last').click();
  // ensure readonly inputs are never focused
  $questionList.children('li:last').find('input[readonly]').focus(function() {
    $(this).blur();
  });

  resizeNav();
});

// Called when user is done creating the rubrics. We create the JSON, validate it
// and send it to the server
$doneRubric.click(function(event) {
  var questionsJSON = createQuestionsJson();
  // Doing validation separately to keep the ugly away from the beautiful
  var errorMessage = validateRubrics(questionsJSON);
  if (errorMessage) {
    $('.error').html(errorMessage);
    // TODO: semicolon
    return
  }

  // TODO: get rid of superfluous lines
  // a = JSON.stringify(questionsJSON, null, 2);
  $('.questions-json-input').val(JSON.stringify(questionsJSON, null, 2));
  $('form').submit();
});

function createQuestionsJson() {
  var questionsJson = [];
  var numQuestions = lastQuestionNum;

  for (var i = 0; i < numQuestions; i++) {
    var partsJson = [];
    questionsJson.push(partsJson);

    // Get all the parts that belong to the current question
    var $parts = $questionList.children('li').eq(i)
                  .children('ul').children('li');
    
    for (var j = 0; j < $parts.length; j++) {
      var $partsLi = $parts.eq(j).children('ul').children('li');

      // By implementation, the first li corresponds to total points and pages
      // for the part we are currently on
      var points = $partsLi.eq(0).find('input').eq(0).val();
      var pages = $partsLi.eq(0).find('input').eq(1).val();
      
      // Convert CSV of pages to array of integers
      // TODO: lots of things going on here. explain or split up
      pages = pages.replace(" ", "").split(",").map(function(page) {
        return parseInt(page, 10);
      });

      // TODO: why does your variable name have the word JSON in it if it's not
      // a string? only use the word JSON if a variable corresponds to text in
      // the JSON format
      partsJson[j] = {
        points: parseFloat(points),
        pages: pages,
        rubrics: []
      };
      var rubrics = partsJson[j].rubrics;

      for (var k = 1; k < $partsLi.length; k++) {
        // TODO: spacing around operators
        var description =  $partsLi.eq(k).find('input').eq(0).val();

        // TODO: points already defined
        var points = $partsLi.eq(k).find('input').eq(1).val();
        
        rubrics.push({
          description: description,
          points: parseFloat(points)
        });
      }
    }
  }

  return questionsJson;
}

// Implement PDF left and right click. Just changes one page at a time.
$previousPage.click(function(){
  if (curPage <= 1) return;
  curPage--;
  goToPage(curPage);
});

$nextPage.click(function(){
  if (curPage >= pdfDoc.numPages) return;
  curPage++;
  goToPage(curPage);
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
});
