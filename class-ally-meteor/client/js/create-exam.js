var pdfDoc = null;
var currPage = 1;

function previousPart() {
  if (currPage == 1) return;
  currPage--;
  goToPage(currPage, pdfDoc);
}

function nextPart() {
  if (currPage == pdfDoc.numPages - 1) return;
  currPage++;
  goToPage(currPage, pdfDoc);
}

Template['create-exam'].events({
  'click .previous-page': previousPart,
  'click .next-page': nextPart
});

Template['create-exam']['rerender-create-exam'] = function() {
  Session.set('rerender-create-exam', false);
  return Session.get('rerender-create-exam');
}

Template['create-exam'].rendered = function() {
  // Initialize everything else
  init();
  $(window).on('keydown', function(e) {

    var $target = $(e.target);
    if ($target.is('input') || $target.is('textarea')) {
      return;
    }

    // Left Key
    if (e.keyCode == 37) { 
       previousPart();
       return false;
    }
    // Right Key
    if (e.keyCode == 39) { 
       nextPart();
       return false;
    }
  });
};

// Unbinds the keydown event when the user leaves the grade page
Template['create-exam'].destroyed = function() {
  $(window).unbind('keydown');
}

function init() {
  // Load the pdf
  var pdfUrl = '/pdf/empty-cs221.pdf';
  showPdf(pdfUrl, currPage, function(_pdfDoc) {pdfDoc = _pdfDoc} );

  var $addQuestion = $('.add-question');
  var $addPart = $('.add-part');
  var $addRubric = $('.add-rubric');
  var $questionList = $('.question-list');
  var $doneRubric = $('.done-rubric');

  var curQuestionNum = 1;
  var curPartNum = 1;
  var lastQuestionNum = 0;  

  $addPart.click(function(event) {
    var $ul = getCurrentQuestion().children('ul');
    curPartNum = $ul.children('li').length + 1;

    var templateData = $addPart.data();
    templateData.questionNum = curQuestionNum;
    templateData.partNum = curPartNum;

    $ul.append(Template['create-part'](templateData));
    $addRubric.click();

    showActiveQuestionAndPart();
  });

  $addRubric.click(function(event) {
    var $ul = getCurrentPart().children('ul');

    $ul.append(Template['create-rubric']());
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
      Session.set('questionsJson', questionsJson);
      Session.set('rerender-create-exam', true);
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
    if (event) event.preventDefault();
    // set the current question to the new question so that it's active
    curQuestionNum = lastQuestionNum + 1;

    var templateData = { questionNum: curQuestionNum };
    $questionList.append(Template['create-question'](templateData));
    lastQuestionNum++;

    $addPart.click();
  });

  // Called when user is done creating the rubrics. We create the JSON, validate it
  // and send it to the server
  $doneRubric.click(function(event) {
    var questionsJson = createQuestionsJson();
    // TODO: Get rid of all the alerts.

    // Doing validation separately to keep the ugly away from the beautiful
    var errorMessage = validateRubrics(questionsJson);
    if (errorMessage) {
      alert (errorMessage);
      return;
    }
    // TODO: Get examname from previous page or something instead of using YOLO
    Meteor.call('createRubricsForExam', 'YOLO', questionsJson, undefined,
                function(err, data) {
                  if (data == true) {
                    alert("Upload successful!");
                  }
                  else {
                    alert("Upload failed: " + data);
                  }
                });
  });

  // Initialize by showing one question
  $addQuestion.click();
  // Will be needed when we are allowing professors to edit exams.
  recreateExamUI(Session.get('questionsJson'));

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
}