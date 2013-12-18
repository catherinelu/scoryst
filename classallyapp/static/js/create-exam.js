var PDF_SCALE = 1.3;
var $canvas = $('.exam-canvas canvas');
var context = $canvas[0].getContext('2d');

var $previousPage = $('.previous-page');
var $nextPage = $('.next-page');

var $addQuestion = $('.add-question');
var $addPart = $('.add-part');
var $addRubric = $('.add-rubric');
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

var url = '/static/pdf/empty-cs221.pdf';
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
      // TODO:
      // resizeNav();
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
      // TODO:
      alert(message);
    }
  );

  // Init the Rubric display UI
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

$(document).keydown(function(event) {
  var $target = $(event.target);
  if ($target.is('input') || $target.is('textarea')) {
    return;
  }

  // Left Key
  if (event.keyCode == 37) { 
     $previousPage.click();
     return false;
  }
  // Right Key
  if (event.keyCode == 39) { 
     $nextPage.click();
     return false;
  }
});

$addPart.click(function(event) {
  event.preventDefault();
  var $ul = getCurrentQuestion().children('ul');
  curPartNum = $ul.children('li').length + 1;

  var templateData = $addPart.data();
  templateData.questionNum = curQuestionNum;
  templateData.partNum = curPartNum;

  $ul.append(templates.renderPartTemplate(templateData));
  $addRubric.click();

  // TODO:
  // resizeNav();
  showActiveQuestionAndPart();
});

$addRubric.click(function(event) {
  event.preventDefault();
  var $ul = getCurrentPart().children('ul');

  $ul.append(templates.renderRubricTemplate());
  // TODO:
  // resizeNav();
});

$questionList.click(function(event) {
  var $target = $(event.target);
  var $li = $target.parent().parent();
  var questionNum = $li.attr('data-question');

  if ($target.is('.fa-minus-circle')) {
    var questionsJson = createQuestionsJson();
    if (questionNum) {
      questionsJson.splice(questionNum - 1, 1);
    } else {
      var partNum = $li.attr('data-part');
      curPartNum = parseInt(partNum, 10);
      questionsJson[curQuestionNum - 1].splice(curPartNum - 1, 1);
    }

    lastQuestionNum = 0;
    curPartNum = 1;

    $questionList.html('');
    $addQuestion.click();
    recreateExamUI(questionsJson);
  }

  // event delegation for plus button
  if (!$target.is('.fa-plus-circle')) {
    return;
  }

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

  $addPart.click();
  // TODO:
  // resizeNav();
});

// Called when user is done creating the rubrics. We create the JSON, validate it
// and send it to the server
$doneRubric.click(function(event) {
  var questionsJSON = createQuestionsJson();
  // Doing validation separately to keep the ugly away from the beautiful
  var errorMessage = validateRubrics(questionsJSON);
  if (errorMessage) {
    $('.error').html(errorMessage);
    return
  }
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
      pages = pages.replace(" ", "").split(",").map(function(page) {
        return parseInt(page, 10);
      });

      partsJson[j] = {
        points: parseFloat(points),
        pages: pages,
        rubrics: []
      };
      var rubrics = partsJson[j].rubrics;

      for (var k = 1; k < $partsLi.length; k++) {
       
        var description =  $partsLi.eq(k).find('input').eq(0).val();
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