$(function() {

  // DOM elements
  var $addQuestion = $('.add-question');
  var $questionList = $('.question-list');
  var $doneRubric = $('.done-rubric');

  var $questionTemplate = $('.question-template');
  var $partTemplate = $('.part-template');
  var $rubricTemplate = $('.rubric-template');

  // Handlebars templates
  var templates = {
    renderQuestionTemplate: Handlebars.compile($questionTemplate.html()),
    renderPartTemplate: Handlebars.compile($partTemplate.html()),
    renderRubricTemplate: Handlebars.compile($rubricTemplate.html())
  };

  var lastQuestionNum = 0;
  var imageLoader = new ImageLoader(1, true, false);

  $(function(){
    // Init the UI by adding one question to be shown to begin with
    $addQuestion.click();

    // Make an AJAX call to check if this exam already exists, in which case
    // the UI will be prepopulated with the existing questions/parts/rubrics.
    $.ajax({
      url: window.location.pathname + 'recreate-exam',
      dataType: 'json'
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

      // Find the ul where the template will be rendered
      var $ul = $addPart.siblings('ul');
      var templateData = {
        questionNum: parseInt($addPart.children('div').data().question, 10),
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

  // handle expanding/contracting of questions/parts when the arrow up/down
  // is clicked
  $questionList.click(function(event) {
    var $target = $(event.target);

    // clicks on h3/h4 should also expand/contract questions/parts
    if ($target.is('h3') || $target.is('h4')) {
      $target = $target.children('i:first');
    }

    var isArrowDown = $target.is('.fa-chevron-circle-down');
    var isArrowUp = $target.is('.fa-chevron-circle-up');

    // If the user clicked on either of them
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

  // handles clicking on trash icon and subsequent deletion of question/part
  $questionList.click(function(event) {
    // event delegation on trash icon
    var $target = $(event.target);
    if ($target.is('.fa-trash-o')) {
      var $li = $target.parents('li').eq(0);
      var questionNum = parseInt($li.data('question'), 10);

      var questions = createQuestionsList();

      // questionNum would be undefined if the user had clicked on the trash
      // icon for a part.
      if (questionNum) {
        // user is trying to remove a question
        questions.splice(questionNum - 1, 1);
      } else {
        // user is trying to remove a part
        var partNum = parseInt($li.data('part'), 10);
        questionNum = $li.parents('li').eq(0).data('question');

        questionNum = parseInt(questionNum, 10);
        questions[questionNum - 1].splice(partNum - 1, 1);
      }

      // Reset it to 0 since recreateExamUI will take care of updating it
      lastQuestionNum = 0;

      // Empty the questionsList since it will be recreated
      $questionList.html('');
      
      $addQuestion.click();
      recreateExamUI(questions);
    }
  });

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

  // Called when user is done creating the rubrics. We create the questions, 
  // validate it and send it to the server
  $doneRubric.click(function(event) {

    var questions = createQuestionsList();
    // Doing validation separately to keep the ugly away from the beautiful
    // validateRubrics function is defined in create-exam-validator.js
    var errorMessage = validateRubrics(questions);
    if (errorMessage) {
      $('.error').html(errorMessage);
      return;
    }

    $('.questions-json-input').val(JSON.stringify(questions, null, 2));
    $('form').submit();
  });

  // Implement left and right click. Just changes one page at a time.
  imageLoader.$previousPage.click(function(){
    if (imageLoader.curPageNum <= 1) return;
    imageLoader.curPageNum--;
    imageLoader.showPage(imageLoader.curPageNum);
  });

  imageLoader.$nextPage.click(function(){
    if (imageLoader.curPageNum >= imageLoader.numPages) return;
    imageLoader.curPageNum++;
    imageLoader.showPage(imageLoader.curPageNum);
  });

  $(document).keydown(function(event) {
    var $target = $(event.target);
    // If the focus is in an input box or text area, we don't want the page
    // to be changing
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
  });

  // Goes over the inputs and creates the list of questions where each question
  // is a list of parts and each part is of the form:
  // {
  //   points: 10,
  //   pages: 1,2,3,
  //   rubrics: [{description: 'Rubric', points:-5},..]
  // }
  function createQuestionsList() {
    var questions = [];
    var numQuestions = lastQuestionNum;

    for (var i = 0; i < numQuestions; i++) {
      var parts = [];
      questions.push(parts);

      // Get all the parts that belong to the current question
      var $parts = $questionList.children('li').eq(i)
                    .children('div').children('ul').children('li');
      
      for (var j = 0; j < $parts.length; j++) {
        // By implementation, the first li corresponds to total points and pages
        // for the part we are currently on
        var points = $parts.eq(j).find('input').eq(0).val();
        var pages = $parts.eq(j).find('input').eq(1).val();
        
        // Convert CSV of pages to array of integers. First we get rid of the
        // whitespeaces. Then we split them from the commas, so that '1,2,3'
        // will now be ['1', '2', '3']
        // Using the map function, these are then converted to integers to finally
        // get [1,2,3]
        pages = pages.replace(' ', '').split(',').map(function(page) {
          return parseInt(page, 10);
        });

        parts[j] = {
          points: parseFloat(points),
          pages: pages,
          rubrics: []
        };
        var rubrics = parts[j].rubrics;

        // Loop over the rubrics and add those to the part
        var $rubricsLi = $parts.eq(j).children('div').children('ul').children('li');
        for (var k = 0; k < $rubricsLi.length; k++) {
          var description = $rubricsLi.eq(k).find('input').eq(0).val();

          var rubric_points = $rubricsLi.eq(k).find('input').eq(1).val();
          
          rubrics.push({
            description: description,
            points: parseFloat(rubric_points)
          });
        }
      }
    }

    return questions;
  }

});
