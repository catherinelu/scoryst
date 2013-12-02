$(function() {
  // TODO: Get this from the URL parameter
  var examAnswerId = "SbnHDqXfMzuXBegmv";

  // Get the current question and part of the exam that the user is viewing
  if (Session.get('currPartNum') === undefined ||
      Session.get('currQuestionNum') === undefined) {
    Session.set('currPartNum', 1);
    Session.set('currQuestionNum', 1);    
  }

  var pdfDoc = null;

  // Exam-nav code
  // -------------

  // Helper functions
  // Pass in the questionPartAnswerId. Returns true if it is graded, else false.
  var isPartGraded = function(questionPartAnswerId) {
    var gradedRubrics = GradedRubric.find({questionPartAnswerId: questionPartAnswerId});
    return (gradedRubrics.fetch().length != 0);
  };

  var getPartSubtractedPoints = function(questionPartAnswerId) {
    var subtractedPoints = 0;
    GradedRubric.find({questionPartAnswerId: questionPartAnswerId}).map(function(gradedRubric) {
      var rubric = Rubric.findOne({_id: gradedRubric.rubricId});
      subtractedPoints += rubric.points;
    });
    return subtractedPoints;
  };

  // Returns the QuestionPart object associated with the current questionPart
  // and exam.
  var getQuestionPart = function(examAnswerId) {
    var currQuestionNum = Session.get("currQuestionNum");
    var currPartNum = Session.get("currPartNum");
    var examId = ExamAnswer.findOne({_id: examAnswerId}).examId;
    return QuestionPart.findOne({questionNum: currQuestionNum, partNum: currPartNum,
                                 examId: examId});
  };

  // Returns true if all of the parts have at least one rubric associated with
  // them. Returns false otherwise.
  Template['exam-nav'].graded = function() {
    var graded = true;
    QuestionPartAnswer.find({examAnswerId: examAnswerId}).map(function(questionPartAnswer) {
      if (!isPartGraded(questionPartAnswer._id)) graded = false;
    });
    return graded;
  };

  Template['exam-nav'].maxPoints = function() {
    var maxPoints = 0;
    QuestionPartAnswer.find({examAnswerId: examAnswerId}).map(function(answer) {
      QuestionPart.find({_id: answer.questionPartId}).map(function(questionPart) {
        maxPoints += questionPart.maxPoints;
      });
    });
    return maxPoints;
  };

  Template['exam-nav'].points = function() {
    var maxPoints = Template['exam-nav'].maxPoints();
    var points = maxPoints;
    QuestionPartAnswer.find({examAnswerId: examAnswerId}).map(function(answer) {
      points += getPartSubtractedPoints(answer._id);
    });
    return points;
  };

  Template['exam-nav'].questions = function() {
    var examId = ExamAnswer.findOne({_id: examAnswerId}).examId;

    // Array of questions to return
    var questions = [];
    // Current question #. Starts at 0, which is not a valid question #.
    var questionNum = 0;
    // Current question we are on. We will be pushing part objects into this.
    var currQuestion = null;
    QuestionPartAnswer.find({examAnswerId: examAnswerId}, {sort: {questionNum: 1, partNum: 1}}).map(function(questionPartAnswer) {
      // Create new parts array
      if (questionNum < questionPartAnswer.questionNum) {
        questionNum++;
        var newQuestionParts = {questionNum: questionNum};
        newQuestionParts.parts = [];
        questions.push(newQuestionParts);
        currQuestion = newQuestionParts.parts;
      }

      // Create a new part, and add it to the correct questions array
      var part = {};
      part.graded = isPartGraded(questionPartAnswer._id);
      questionPart = QuestionPart.findOne({_id: questionPartAnswer.questionPartId});
      part.questionNum = questionPartAnswer.questionNum;
      part.partNum = questionPartAnswer.partNum;
      part.maxPartPoints = questionPart.maxPoints;
      part.partPoints = questionPart.maxPoints + getPartSubtractedPoints(questionPartAnswer._id);
      currQuestion.push(part);
    });

    questions.forEach(function(question) {
      question.parts.forEach(function(part) {
        part.active = false;
      });
    });

    questions[Session.get('currQuestionNum') - 1].parts[Session.get('currPartNum') - 1].active = true;
    return questions;
  };

  Template['rubrics-nav'].graded = function() {
    return Template['exam-nav'].questions()[Session.get('currQuestionNum') - 1].parts[Session.get('currPartNum') - 1].graded;
  };

  Template['rubrics-nav'].points = function() {
    return Template['exam-nav'].questions()[Session.get('currQuestionNum') - 1].parts[Session.get('currPartNum') - 1].partPoints;
  };

  Template['rubrics-nav'].maxPoints = function() {
    return Template['exam-nav'].questions()[Session.get('currQuestionNum') - 1].parts[Session.get('currPartNum') - 1].maxPartPoints;
  };  

  Template['rubrics-nav'].questionNum = function() {
    return Session.get('currQuestionNum');
  };

  Template['rubrics-nav'].partNum = function() {
    return Session.get('currPartNum');
  };

  Template['rubrics-nav'].comment = function() {
    var answer = QuestionPartAnswer.findOne({
      examAnswerId: examAnswerId,
      questionNum: Session.get('currQuestionNum'),
      partNum: Session.get('currPartNum')
    });
    return answer.graderComments;
  };

  Template.rubrics.rubrics = function() {
    var questionPartId = getQuestionPart(examAnswerId)._id;

    rubrics = [];
    Rubric.find({questionPartId: questionPartId}).map(function(rubric) {
      var color = (rubric.points == 0 ? "green" : "red");
      var selected = (GradedRubric.find({rubricId: rubric._id}).fetch() == 0 ? false : true);
      rubrics.push({points: rubric.points, description: rubric.description,
                    selected: selected, color: color});
    });

    var num = 1;
    rubrics.forEach(function(rubric) {
      rubric.rubricNum = num++;
    });

    if (rubrics.length > 0) rubrics[rubrics.length - 1].custom = true;
    // TODO: use the currQuestionNum and currPartNum to figure out which page 
    // to go to
    // This code is here because everytime the questionNum or partNum is updated
    // this template will be rerendered.
    // if (pdfDoc !== null) {
    // 
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
    'click li': function(event) {
      var $target = $(event.target);
      if (!$target.is('li')) $target = $target.parents('li');
      $target.toggleClass('selected');
      var rubricNum = parseInt($target.find('a').attr('data-rubric'), 10);
      
      // Find the part answer associated with the current exam, current questionNum
      // and current part num.
      var questionPartAnswer = QuestionPartAnswer.findOne({
        examAnswerId: examAnswerId,
        questionNum: Session.get('currQuestionNum'),
        partNum: Session.get('currPartNum')
      });

      var questionPartId = questionPartAnswer.questionPartId;
      var questionPartAnswerId = questionPartAnswer._id;

      var rubric = Rubric.findOne({questionPartId: questionPartId, rubricNum: rubricNum});
      var gradedRubric = GradedRubric.findOne({
        questionPartAnswerId: questionPartAnswerId,
        rubricId: rubric._id
      });

      if (gradedRubric === undefined) {
        GradedRubric.insert({
          questionPartAnswerId: questionPartAnswerId,
          rubricId: rubric._id
        });
      }
      else {
        GradedRubric.remove(gradedRubric._id);
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
      
      // keyCode for 'a' or 'A' is 65
      var rubricNum = e.keyCode - 64;
      
      // Select a rubric
      var rubric = $('.grading-rubric').find('a[data-rubric="' + rubricNum + '"]')[0];
      if (rubric !== undefined) {
        rubric.click();
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
