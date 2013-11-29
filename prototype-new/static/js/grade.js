// Copied the PDF code from create-exam.html
var PDF_SCALE = 1.3;
var $canvas = $('.exam-canvas canvas');
var context = $canvas[0].getContext('2d');

var $previousPage = $('.previous-page');
var $nextPage = $('.next-page');

var url = 'static/pdf/cglu-cs144.pdf';
var jsonURL = 'static/json/cglu-cs144.json';
var pdfDoc = null;
var currPage = 1;
var examJSON = null;
var currQuestionNum = 1;
var currPartNum = 1;

var $questionsNav = $('.question-nav');
var $rubricsList = $('.grading-rubric');

var $examTemplate = $('.exam-template');
var $questionTemplate = $('.question-template');
var $partTemplate = $('.part-template');
var $rubricsTemplate = $('.rubrics-template');
var $singleRubricTemplate = $('.single-rubric-template');

var templates = {
  renderExamTemplate: Handlebars.compile($examTemplate.html()),
  renderQuestionTemplate: Handlebars.compile($questionTemplate.html()),
  renderPartTemplate: Handlebars.compile($partTemplate.html()),
  renderRubricsTemplate: Handlebars.compile($rubricsTemplate.html()),
  renderSingleRubricTemplate: Handlebars.compile($singleRubricTemplate.html())
};

/* Resizes the page navigation to match the canvas height. */
function resizePageNavigation() {
  $previousPage.height($canvas.height());
  $nextPage.height($canvas.height());
}

$(window).resize(resizePageNavigation);

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
  currPage = num;
  renderPage(currPage);
}

$(function() {
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

  PDFJS.disableWorker = true;
  PDFJS.getDocument(url).then(
    function getPdf(_pdfDoc) {
      pdfDoc = _pdfDoc;
      makeAjaxCall (jsonURL, createExamUI, alert, false);
      renderPage(currPage);
    },
    function getPdfError(message, exception) {
      alert(message);
    }
  );
});

function createExamUI(data) {
  examJSON = data;
  var templateData = {
    graded: examJSON.graded,
    score: examJSON.pointsScored,
    maxScore: examJSON.maxScore 
  };

  $questionsNav.children('ul').append(templates.renderExamTemplate(templateData));
  
  for (var i = 0; i < examJSON.questions.length; i++) {
    var templateData = { questionNum: i + 1 };
    $questionsNav.children('ul').append(templates.renderQuestionTemplate(templateData));
    
    for (var j = 0; j < examJSON.questions[i].parts.length; j++) {
      var part = examJSON.questions[i].parts[j];
      var templateData = {
        questionNum: i + 1,
        partNum: j + 1,
        graded: part.graded,
        score: part.pointsScored,
        maxScore: part.maxScore
      };
      $questionsNav.children('ul').append(templates.renderPartTemplate(templateData));
    }
  }
  $questionsNav
  .find('a[data-question="' + currQuestionNum +'"][ data-part="' + currPartNum + '"]')[0].click();
}

$questionsNav.children('ul').click(function() {
  var $target = $(event.target);
  if (!$target.is('a')) return;
  $questionsNav.children('ul').children('li').removeClass('active');
  $target.parent().addClass('active');
  currQuestionNum = parseInt($target.attr('data-question'), 10);
  currPartNum = parseInt($target.attr('data-part'), 10);
  renderRubric(currQuestionNum, currPartNum);
});

function renderRubric(questionNum, partNum) {
  currQuestionNum = questionNum;
  currPartNum = partNum;
  var part = examJSON.questions[questionNum - 1].parts[partNum - 1];
  // Go to the pdf page corresponding to current question and part
  goToPage(part.pages[0]);
  var templateData = {
    questionNum: questionNum,
    partNum: partNum,
    graded: part.graded,
    score: part.pointsScored,
    maxScore: part.maxScore,
    comment: part.comments
  };
  $rubricsList.html(templates.renderRubricsTemplate(templateData));

  for (var i = 0; i < part.rubric.length; i++) {
    var rubric =  part.rubric[i];
    templateData = {
      rubricNum: i + 1,
      selected: rubric.checked,
      reason: rubric.reason,
      points: rubric.points,
      custom: i == part.rubric.length - 1 ? true : false
    }
    $rubricsList.children('ol').append(templates.renderSingleRubricTemplate(templateData));
  }
}

$rubricsList.click(function() {
  var $target = $(event.target);
  // User chose a rubric
  if ($target.is('a')) {
    var rubricNum = $target.attr('data-rubric')
    // Custom score rubric
    if (rubricNum == examJSON.questions[currQuestionNum - 1].parts[currPartNum - 1].rubric.length) {
      return;
    }
    $target.parent().toggleClass('selected');
    var rubric = examJSON.questions[currQuestionNum - 1].parts[currPartNum - 1].rubric[rubricNum - 1];
    rubric.checked = !rubric.checked;
  } else if ($target.is('button')) {
    updateComment();
  } 
});

function updateComment() {
  var $commentTextarea = $('.comment-textarea');
  var $saveEditComment = $('.comment-save-edit');
  var disabled = $commentTextarea.prop('disabled');
  // Comment already exists
  if (disabled) {
    $saveEditComment.html("Save comment");
  } else {
    if ($commentTextarea.val() === "") {
      return;
    }
    $saveEditComment.html("Edit comment");
  }
  $commentTextarea.prop('disabled', !disabled);
}

$previousPage.click(function(){
  var part = examJSON.questions[currQuestionNum - 1].parts[currPartNum - 1];
  var index = part.pages.indexOf(currPage);
  if (index > 0) {
    goToPage(part.pages[index - 1]);
  } else if (currPartNum > 1) {
    $questionsNav
    .find('a[data-question="' + currQuestionNum +'"][ data-part="' + (currPartNum - 1) + '"]')[0].click();
  } else if (currQuestionNum > 1) {
    currPartNum = examJSON.questions[currQuestionNum - 2].parts.length;
    $questionsNav
    .find('a[data-question="' + (currQuestionNum - 1) +'"][ data-part="' + currPartNum + '"]')[0].click();
  }
});


$nextPage.click(function(){
  var part = examJSON.questions[currQuestionNum - 1].parts[currPartNum - 1];
  var index = part.pages.indexOf(currPage);
  if (index < part.pages.length - 1) {
    goToPage(part.pages[index + 1]);
  } else if (currPartNum < examJSON.questions[currQuestionNum - 1].parts.length) {
    $questionsNav
    .find('a[data-question="' + currQuestionNum +'"][ data-part="' + (currPartNum + 1) + '"]')[0].click();
  } else if (currQuestionNum < examJSON.questions.length) {
    $questionsNav
    .find('a[data-question="' + (currQuestionNum + 1) +'"][ data-part="' + 1 + '"]')[0].click();
  }
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

  var part = examJSON.questions[currQuestionNum - 1].parts[currPartNum - 1];
  // keyCode for 'a' or 'A' is 65
  var rubricNum = e.keyCode - 64;
  // Select a rubric
  if (rubricNum >= 1 && rubricNum <= part.rubric.length) {
    $rubricsList.find('a[data-rubric="' + rubricNum + '"]')[0].click();
  }
});

function makeAjaxCall(url, successFn, failureFn, isAjax) {
  $.ajax({
    type: "get",
    url: url,
    ajax: isAjax !== undefined ? isAjax : true,
    dataType: "json",
    error: function(request, error) {
      if (failureFn) {
        failureFn (error);
      } else {
        alert (error);
      }
    },
    success: function(jsonResponse) {
      successFn (jsonResponse);
    }
  });
}