// TODO: browserify
var QuestionPartAnswerModel = Backbone.Model.extend({});

var QuestionPartAnswerCollection = Backbone.Collection.extend({
  model: QuestionPartAnswerModel,
  url: function() {
    return window.location.href + this.examID + '/' +
      this.courseUserID + '/question-part-answer/';
  },

  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read') {
      throw 'Can only read the list of question parts.';
    }
    return Backbone.sync.apply(this, arguments);
  },

  setExam: function(examID) {
    this.examID = examID;
  },

  getExam: function() {
    return this.examID;
  },

  setCourseUserID: function(courseUserID) {
    this.courseUserID = courseUserID;
  },

  getCourseUserID: function() {
    return this.courseUserID;
  },

  // Aggregates all parts of a given question into the question. Returns
  // {
  //   isGraded: isGraded,    // Whether the entire exam is graded
  //   points: points,        // points scored for the entire exam
  //   maxPoints: maxPoints,  // maximum points for the exam
  //   questions: questions   // an array of questions
  // }
  //
  // where each question in the questions array is of the form
  //
  // {
  //   questionNumber: questionNumber,
  //   isGraded: true,
  //   graders: graders,
  //   points: points,
  //   maxPoints: maxPoints,
  //   parts: parts
  // }
  // and each part is of the same form, except it has partNumber instead of
  // questionNumber.
  //
  aggregateQuestions: function() {

    // Returns the first character from every word in the string
    function getInitials(str) {
      var matches = str.match(/\b(\w)/g);
      return matches.join('');
    }

    // Given a list of graders ['John Doe', 'Don Joe'], returns 'JD, DJ'
    // Returns the entire name if only one grader is in the list
    // Returns '' if list was empty
    function joinGraders(strList) {
      if (strList.length == 0) return '';
      if (strList.length == 1) return strList[0];

      var joinedGraders = getInitials(strList[0]);
      for (var i = 1; i < strList.length; i++) {
        joinedGraders += ', ' + getInitials(strList[i]);
      }
      return joinedGraders;
    }

    var questionPartAnswers = this.toJSON();
    var isGraded = true;
    var points = 0;
    var maxPoints = 0;
    var questions = [];

    var previousQuestionNumber;
    var question;

    for (var i = 0; i < questionPartAnswers.length; i++) {
      var questionNumber = questionPartAnswers[i].question_part.question_number;

      if (questionNumber !== previousQuestionNumber) {
        // For the very first question, we don't push anything before
        if (question !== undefined) {
          // Aggregate points for the entire exam
          points += question.points;
          maxPoints += question.maxPoints;
          isGraded = isGraded && question.isGraded;

          question.graders = joinGraders(question.graders);
          questions.push(question);
        }

        question = {
          questionNumber: questionNumber,
          isGraded: true,
          graders: [],
          points: 0,
          maxPoints: 0,
          parts: []
        };
        previousQuestionNumber = questionNumber;
      }

      var part = {
        isGraded: questionPartAnswers[i].is_graded,
        partNumber: questionPartAnswers[i].question_part.part_number,
        points: questionPartAnswers[i].points,
        maxPoints: questionPartAnswers[i].question_part.max_points,
        grader: questionPartAnswers[i].grader_name
      };

      question.parts.push(part);
      question.isGraded = question.isGraded && part.isGraded;
      // Aggregate points for the question
      question.points += part.points;
      question.maxPoints += part.maxPoints;

      if (question.graders.indexOf(part.grader) === -1) {
        question.graders.push(part.grader);
      }
    }

    // Handle the fence post problem. I hate fence post problems.
    points += question.points;
    maxPoints += question.maxPoints;
    isGraded = isGraded && question.isGraded;

    question.graders = joinGraders(question.graders);
    questions.push(question);

    return {
      isGraded: isGraded,
      points: points,
      maxPoints: maxPoints,
      questions: questions
    };
  }
});
