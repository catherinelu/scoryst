$(function() {
  // Get the current question and part of the exam that the user is viewing
  if (Session.get('currPartNum') === undefined ||
      Session.get('currQuestionNum') === undefined) {
    Session.set('currPartNum', 1);
    Session.set('currQuestionNum', 1);    
  }

  var pdfDoc = null;

  // Exam-nav code

  // Returns true if all of the parts have at least one rubric associated with
  // them. Returns false otherwise.
  // Template['exam-nav'].graded = true;
  Template['exam-nav'].graded = function() {
    // TODO: Get the userexamId as a URL parameter
    var userExamId = "uWXmxxpNq39Ly5Jug";
    var graded = true;
    QuestionPartAnswer.find({examAnswerId: userExamId}).map(function(answer) {
      gradedRubrics = GradedRubric.find({questionAnswerId: answer._id});
      if (gradedRubrics.fetch().length == 0) {
        graded = false;
      }
    });
    return graded;
  };

  Template['exam-nav'].maxPoints = function() {
    var maxPoints = 0;
    // TODO: Get the userexamId as a URL parameter
    var userExamId = "uWXmxxpNq39Ly5Jug";
    QuestionPartAnswer.find({examAnswerId: userExamId}).map(function(answer) {
      QuestionPart.find({_id: answer.questionPartId}).map(function(questionPart) {
        maxPoints += questionPart.maxPoints;
      });
    });
    return maxPoints;
  };

  Template['exam-nav'].points = function() {
    var maxPoints = Template['exam-nav'].maxPoints();
    // TODO: Get the userexamId as a URL parameter
    var userExamId = "uWXmxxpNq39Ly5Jug";
    var subtractedPoints = maxPoints;
    QuestionPartAnswer.find({examAnswerId: userExamId}).map(function(answer) {
      GradedRubric.find({questionPartAnswerId: answer._id}).map(function(gradedRubric) {
        var rubric = Rubric.findOne({_id: gradedRubric.rubricId});
        subtractedPoints += rubric.points;
      });
    });
    return subtractedPoints;
  };

  Template['exam-nav'].questions = function() {
    var questions = [
      {
        'parts': [
          {
            'graded': true,
            'partPoints': 4,
            'maxPartPoints': 5
          },
          {
            'graded': true,
            'partPoints': 0,
            'maxPartPoints': 5
          }
        ]
      },
      {
        'parts': [
          {
            'graded': true,
            'partPoints': 3,
            'maxPartPoints': 5
          },
          {
            'graded': false,
            'partPoints': 3,
            'maxPartPoints': 5
          }
        ]
      },
    ]

    questions.forEach(function(question) {
      question.parts.forEach(function(part) {
        part.active = false;
      });
    });

    questions[Session.get('currQuestionNum') - 1].parts[Session.get('currPartNum') - 1].active = true;
    return questions;
  };

  // var rubrics = ...get from database

  // TODO: Read from JSON or database
  Template['rubrics-nav'].graded = function() {
    return Template['exam-nav'].questions()[Session.get('currQuestionNum') - 1].parts[Session.get('currPartNum') - 1].graded;
  };

  Template['rubrics-nav'].points = function() {
    // TODO: Get from database
    return Template['exam-nav'].questions()[Session.get('currQuestionNum') - 1].parts[Session.get('currPartNum') - 1].partPoints;
  };

  Template['rubrics-nav'].maxPoints = function() {
    // TODO: Get from database
    return Template['exam-nav'].questions()[Session.get('currQuestionNum') - 1].parts[Session.get('currPartNum') - 1].maxPartPoints;
  };  

  Template['rubrics-nav'].questionNum = function() {
    return Session.get('currQuestionNum');
  };

  Template['rubrics-nav'].partNum = function() {
    return Session.get('currPartNum');
  };

  Template['rubrics-nav'].comment = function() {
    return "Comment";
  };

  Template.rubrics.rubrics = function() {
    // TODO: Get from database
    var rubrics = [
      {
        "points":-3,
        "reason":"Correct solution, but no explanation",
        "checked":false
      },
      {
        "points":-2,
        "reason":"Gave answer in millisecond instead of seconds",
        "checked":false
      },
      {
        "points":-5,
        "reason":"Wrong answer",
        "checked":false
      },
      {
        "points":0,
        "reason":"Correct answer",
        "checked":true,
        "color":"green"
      },
      {
        "points": null,
        "reason":"Custom Points",
        "checked":false
      }
    ];

    var num = 1;
    rubrics.forEach(function(rubric) {
      rubric.rubricNum = num++;
    });

    rubrics[rubrics.length - 1].custom = true;
    // TODO: use the new page number to render the correct pdf page
    // if (pdfDoc !== null) {
    //   goToPage(1, pdfDoc);
    // }
    return rubrics;
  };

  function previousPart() {
    // TODO: Use currQuestionNum and currPartNum to see the pages associated
    // with the current part. If it has multiple pages, go to the previous page
    // Else if currPartNum > 1, go to currPartNum - 1
    // Else if currQuestionNum > 1, go to the last part of currQuestionNum - 1
    Session.set('currQuestionNum', 1);
    goToPage(1, pdfDoc);
  }

  function nextPart() {
    // TODO: Similar logic to previous part
    Session.set('currQuestionNum', 2);
    goToPage(2, pdfDoc);
  }

  Template.grade.events({
    'click .previous-page': previousPart,
    'click .next-page': nextPart
  });

  Template['exam-nav'].events({
    'click a': function(event) {
      var $target = $(event.target);
      var questionNum = parseInt($target.attr('data-question'), 10);
      var partNum =  parseInt($target.attr('data-part'), 10);
      Session.set('currQuestionNum', questionNum);
      Session.set('currPartNum', partNum);
    }
  })

  Template.rubrics.events({
    'click a': function(event) {
      var $target = $(event.target);
      if ($target.is('a')) {
        $target.parent().toggleClass('selected');
        // TODO: Update database
      }
    }
  });

  Template['rubrics-nav'].events({
    'click button': updateComment
  });

  Template.grade.events({
    /* To toggle the question navigation. */
    'click .question-nav > a': function() {
      if ($('.question-nav ul').css('display') == 'none') {
        $('.question-nav ul').css('display', 'inherit');   
        $('.question-nav i').attr('class', 'fa fa-minus-circle fa-lg');
      } else {
        $('.question-nav ul').css('display', 'none');
        $('.question-nav i').attr('class', 'fa fa-plus-circle fa-lg');
      }
    }
  });

  Template.grade.created = function() {
    // Load the pdf
    var pdfUrl = '/pdf/cglu-cs144.pdf';
    // TODO: Update the page number from 1 to the correct one.
    showPdf(pdfUrl, 1, function(_pdfDoc) {pdfDoc = _pdfDoc} );
  }

  // Keyboard shortcuts for navigating
  Template.grade.rendered = function() {

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

      // TODO: 
      // var part = examJSON.questions[currQuestionNum - 1].parts[currPartNum - 1];
      
      // keyCode for 'a' or 'A' is 65
      var rubricNum = e.keyCode - 64;
      
      // Select a rubric
      if (rubricNum >= 1 && rubricNum <= 5) {
        // part.rubric.length) {
        $('.grading-rubric').find('a[data-rubric="' + rubricNum + '"]')[0].click();
      }
    });
  };

  // Unbinds the keydown event when the user leaves the grade page
  Template.grade.destroyed = function() {
    $(window).unbind('keydown');
  }

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

});
