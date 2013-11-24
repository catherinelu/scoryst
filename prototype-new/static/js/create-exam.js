var PDF_SCALE = 1.3;
var $canvas = $('.exam-canvas canvas');
var context = $canvas[0].getContext('2d');

var $previousPage = $('.previous-page');
var $nextPage = $('.next-page');

var $addQuestion = $('.add-question');
var $addPart = $('.add-part');
var $addRubric = $('.add-rubric');
var $questionList = $('.question-list');

var $questionTemplate = $('.question-template');
var $partTemplate = $('.part-template');
var $rubricTemplate = $('.rubric-template');

var templates = {
  renderQuestionTemplate: Handlebars.compile($questionTemplate.html()),
  renderPartTemplate: Handlebars.compile($partTemplate.html()),
  renderRubricTemplate: Handlebars.compile($rubricTemplate.html())
};

var url = 'static/pdf/empty-cs221.pdf';
var pdfDoc = null;
var currPage = 1;

var curQuestionNum = 1;
var curPartNum = 1;
var lastQuestionNum = 0;

/* Resizes the page navigation to match the canvas height. */
function resizePageNavigation() {
  $previousPage.height($canvas.height());
  $nextPage.height($canvas.height());
}

$(window).resize(resizePageNavigation);

// Globals we get from classLumoUI.js: pdfDoc, pageNum

// Get page info from document, resize canvas accordingly, and render page
function renderPage(num) {
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

function goToPage(num) {
  if (num < 1 || num > pdfDoc.numPages) return;
  pageNum = num;
  renderPage(pageNum);
}

$(document).ready(function() {
  PDFJS.disableWorker = true;
  PDFJS.getDocument(url).then(
    function getPdf(_pdfDoc) {
      pdfDoc = _pdfDoc;
      renderPage(currPage);
    },
    function getPdfError(message, exception) {
      alert(message);
    }
  );

  // Init the Rubric display UI
  $("#add_question").click();
  $addQuestion.click();
});

$previousPage.click(function(){
  if (currPage <= 1) return;
  currPage--;
  goToPage (currPage);
});

$nextPage.click(function(){
  if (currPage >= pdfDoc.numPages) return;
  currPage++;
  goToPage(currPage);
});

$(document).keydown(function(e) {
  var $target = $(event.target);
  if ($target.is('input') || $target.is('textarea')) {
    return;
  }

  // Left Key
  if (e.keyCode == 37) { 
     $previousPage.click();
     return false;
  }
  // Right Key
  if (e.keyCode == 39) { 
     $nextPage.click();
     return false;
  }
});

$addPart.click(function(event) {
  event.preventDefault();
  var $ul = getCurrentQuestion().children('ul');
  curPartNum = $ul.children('li').length + 1;

  var templateData = $addPart.data();
  templateData.partNum = curPartNum;

  $ul.append(templates.renderPartTemplate(templateData));
  $('.add-rubric').click();

  resizeNav();
  showActiveQuestionAndPart();
});

$addRubric.click(function(event) {
  event.preventDefault();
  var $ul = getCurrentPart().children('ul');

  $ul.append(templates.renderRubricTemplate());
  resizeNav();
});

$questionList.click(function(event) {
  var $target = $(event.target);

  // event delegation for plus button
  if (!$target.is('.fa-plus-circle')) {
    return;
  }

  var $li = $target.parent()
    .parent();
  var questionNum = $li.attr('data-question');

  if (questionNum) {
    // user clicked on + button for question
    curQuestionNum = parseInt(questionNum, 10);
    curPartNum = 1;

    showActiveQuestionAndPart();
  } else {
    // user clicked on + button for part
    var partNum = $li.attr('data-part');
    curPartNum = parseInt(partNum, 10);

    showActiveQuestionAndPart();
  }
});

/* Gets the current question li element. */
function getCurrentQuestion() {
  return $questionList.children('li[data-question="' + curQuestionNum + '"]');
}

/* Gets the current part li element. */
function getCurrentPart() {
  return getCurrentQuestion().find('li[data-part="' + curPartNum + '"]');
}

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
  // set the current question to the new question so that it's active
  curQuestionNum = lastQuestionNum + 1;

  var templateData = { questionNum: curQuestionNum };
  $questionList.append(templates.renderQuestionTemplate(templateData));
  lastQuestionNum++;

  $('.add-part').click();
  resizeNav();
});

// User is done creating the rubric. Validate it and send over a JSON to backend
$("#rubric_done").click(function() {
  var rubricJSON = {};
  rubricJSON.questions = {};

  for (var i = 1; i < lastQuestion; i++) {
    rubricJSON.questions[i] = {};
    var question = rubricJSON.questions[i];
    
    var numParts = 1;
    while ($("#question" + i + "_part_" + numParts + "_points").length) {
      numParts++;
    }
    for (var j = 1; j < numParts; j++) {
      question[j] = {};
      question[j].points = $("#question" + i + "_part_" + j + "_points").val();
      var pages = $("#question" + i + "_part_" + j + "_pages").val();
      pages.replace(" ", "");
      var nanPage = false;
      pages = pages.split(",").map(function(page) {
        var pageNum = parseInt(page, 10);
        if (isNaN(pageNum)) nanPage = true;
        return parseInt(page, 10);
      });
      if (pages === null) {
        nanPage = true;
      }
      question[j].pages = pages;

      if (question[j].points === "" || nanPage) {
        // If only one of them is messed up, we want to give the error message
        if (question[j].points === "" && nanPage) {
          // It was the last rubric ignore it.
          if (j == numParts - 1) {
            delete question[j];
            break;
          }
        }
        alert("Invalid format, please fix");
      }
      question[j].rubrics = [];

      var rubrics = $("#question" + i + "_part_" + j + "_pages").next().children();
      for (var k = 0; k < rubrics.length; k+=2) {
        var desc = $(rubrics[k]).val();
        var points = parseFloat($(rubrics[k+1]).val());
        if (isNaN(points) || desc === "") {
          // User didn't enter anything. We can't allow k==0 since we need 
          // at least one rubric
          if (isNaN(points) && desc === "" && k) continue;
          alert("Invalid format, please fix");
          return;
        }
        question[j].rubrics.push({"description": desc, "points": points});
      }
    }
  }
});
