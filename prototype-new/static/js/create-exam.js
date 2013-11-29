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

  var $li = $target.parent().parent();
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

  $addPart.click();
  resizeNav();
});

// Called when user is done creating the rubrics. We create the JSON, validate it
// and send it to the server
$doneRubric.click(function(event) {
  var questionsJSON = [];
  var numQuestions = lastQuestionNum;
  for (var i = 0; i < numQuestions; i++) {
    var partsJSON = [];
    questionsJSON.push(partsJSON);

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

      partsJSON[j] = {
        points: parseFloat(points),
        pages: pages,
        rubrics: []
      };
      var rubrics = partsJSON[j].rubrics;

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
  // Doing validation separately to keep the ugly away from the beautiful
  var errorMessage = validateRubrics(questionsJSON);
  if (errorMessage) {
    alert (errorMessage); // Sorry Karthik =P
  }
  a = JSON.stringify(questionsJSON, null, 2);
});


// Do not touch unless you're dead sure what you're doing.
function validateRubrics(questionsJSON) {
  // If a question is empty, replace it with null. We will delete it at the end.
  nullifyEmptyJSON(questionsJSON, isQuestionEmpty);
  
  // Nothing entered at all
  if (isEmpty(questionsJSON)) {
    return "Please fill in the rubrics!";
  }

  for (var i = 0; i < questionsJSON.length; i++) {
    var questionJSON = questionsJSON[i];
    // Ignore the questions that will be deleted
    if (questionJSON === null) {
      continue;
    }

    // Nullify all the empty parts in the question
    nullifyEmptyJSON(questionJSON, isPartEmpty);

    for (var j = 0; j < questionJSON.length; j++) {
      var partJSON = questionJSON[j];
      // Ignore the parts that will be deleted
      if (partJSON === null) {
        continue;
      }
      if (isNaN(partJSON.points) || isArrayInvalid(partJSON.pages)) {
        return "Please fix question: " + (i + 1) + " part: " + (j + 1);
      }

      nullifyEmptyJSON(partJSON.rubrics, isRubricEmpty);

      if (isEmpty(partJSON.rubrics)) {
        return "No rubrics entered for question: " + (i + 1) 
                + " part: " + (j + 1);
      }

      for (var k = 0; k < partJSON.rubrics.length; k++) {
        var rubric = partJSON.rubrics[k];
        if (rubric === null) {
          continue;
        }
        if (rubric.description === "" || isNaN(rubric.points)) {
          return "Please fix question: " + (i + 1) + "part: " + (j + 1) + 
                 " rubric: " + (k + 1);
        }
      }
    }
  }

  // Time to delete everything that was made null
  removeEmptyJSON(questionsJSON);
  for (var i = questionsJSON.length - 1; i >= 0; i--) {
    removeEmptyJSON(questionsJSON[i]);
    for (var j = questionsJSON[i].length - 1; j >= 0; j--) {
      removeEmptyJSON(questionsJSON[i][j].rubrics);
    }
  }
  console.log(questionsJSON);
}

function nullifyEmptyJSON(json, emptyFn) {
  for (var i = 0; i < json.length; i++) {
    if (emptyFn(json[i])) {
      json[i] = null;
    }
  }
}

function isEmpty(json) {
  for (var i = 0; i < json.length; i++) {
    if (json[i] !== null) {
      return false;
    }
  }
  return true;
}

function removeEmptyJSON(json) {
  for (var i = json.length - 1; i >= 0; i--) {
    if (json[i] === null) {
      json.splice(i, 1);
    }
  }
}

function isQuestionEmpty(questionJSON) {
  for (var i = 0; i < questionJSON.length; i++) {
    if (!isPartEmpty(questionJSON[i])) {
      return false;
    }
  }
  return true;
}

function isPartEmpty(partJSON) {
  return (isNaN(partJSON.points) && isArrayInvalid(partJSON.pages) && 
          allRubricsEmpty(partJSON.rubrics));
}

function allRubricsEmpty(rubricsJSON) {
  for (var i = 0; i < rubricsJSON.length; i++) {
    if (!isRubricEmpty(rubricsJSON[i])) {
      return false;
    }
  }
  return true;
}

function isRubricEmpty(rubricJSON) {
  return rubricJSON.description === "" && isNaN(rubricJSON.points);
}

function isArrayInvalid(arr) {
  if (arr.length === 0) return true;
  for (var i = 0; i < arr.length; i++) {
    if (isNaN(arr[i])) {
      return true;
    }
  }
  return false;
}
