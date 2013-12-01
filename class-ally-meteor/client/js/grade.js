$(function() {
  // Get the current question and part of the exam that the user is viewing
  if (Session.get('currPartNum') === undefined ||
      Session.get('currQuestionNum') === undefined) {
    Session.set('currPartNum', 1);
    Session.set('currQuestionNum', 1);    
  }

  // Load the pdf
  var pdfDoc = null;
  var pdfUrl = '/pdf/cglu-cs144.pdf';
  showPdf(pdfDoc, pdfUrl, 1);

  // Examnav code
  // TODO: Read from JSON or database
  Template.examnav.graded = true;
  Template.examnav.score = 89;
  Template.examnav.maxScore = 100;
  Template.examnav.questions = function() {
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
  Template.rubricsnav.graded = function() {
    return Template.examnav.questions()[Session.get('currQuestionNum') - 1].parts[Session.get('currPartNum') - 1].graded;
  };

  Template.rubricsnav.score = function() {
    // TODO: Get from database
    return Template.examnav.questions()[Session.get('currQuestionNum') - 1].parts[Session.get('currPartNum') - 1].partScore;
  };

  Template.rubricsnav.maxScore = function() {
    // TODO: Get from database
    return Template.examnav.questions()[Session.get('currQuestionNum') - 1].parts[Session.get('currPartNum') - 1].maxPartScore;
  };  

  Template.rubricsnav.questionNum = function() {
    return Session.get('currQuestionNum');
  };

  Template.rubricsnav.partNum = function() {
    return Session.get('currPartNum');
  };

  Template.rubricsnav.comment = function() {
    return "Comment";
  };

  Template.rubrics.rubrics = function() {
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
    rubrics[rubrics.length - 1].custom = true;
    return rubrics;
  };

  // Keyboard shortcuts for navigating
  Template.grade.rendered = function() {
    $(window).on('keydown', function(e) {
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
  };

  // Unbinds the keydown event when the user leaves the grade page
  Template.grade.destroyed = function() {
    $(window).unbind('keydown');
  }
});
