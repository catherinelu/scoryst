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
  Template['exam-nav'].graded = function() {
    // TODO: Get the userexamId as a URL parameter
    var userExamId = "jonLdB3m2m8wsgp8v";
    QuestionPartAnswer.find({examAnswerId: userExamId}).map(function(answer) {
      var gradedRubrics = GradedRubric.find({questionAnswerId: answer._id});
      if (!gradedRubrics.hasNext()) return false;
    });
    return true;
  };

  Template['exam-nav'].score = 89;
  Template['exam-nav'].maxScore = 100;
  Template['exam-nav'].questions = function() {
    var questions = [
      {
        'questionNum': 1,
        'parts': [
          {
            'partNum': 1,
            'graded': true,
            'partScore': 4,
            'maxPartScore': 5
          },
          {
            'partNum': 2,
            'graded': true,
            'partScore': 0,
            'maxPartScore': 5
          }
        ]
      },
      {
        'questionNum': 2,
        'parts': [
          {
            'partNum': 1,
            'graded': true,
            'partScore': 3,
            'maxPartScore': 5
          },
          {
            'partNum': 2,
            'graded': false,
            'partScore': 3,
            'maxPartScore': 5
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

  Template['rubrics-nav'].score = function() {
    // TODO: Get from database
    return Template['exam-nav'].questions()[Session.get('currQuestionNum') - 1].parts[Session.get('currPartNum') - 1].partScore;
  };

  Template['rubrics-nav'].maxScore = function() {
    // TODO: Get from database
    return Template['exam-nav'].questions()[Session.get('currQuestionNum') - 1].parts[Session.get('currPartNum') - 1].maxPartScore;
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
        "reason":"Custom score",
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
