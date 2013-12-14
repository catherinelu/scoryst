Meteor.startup(function() {
  // Represents a class.
  Class = new CollectionSchema('class', expects('schema', {
    name: expects('length', 1, 50),
    term: expects(String, 'choice', ['fall', 'winter', 'spring', 'summer']),
    year: expects('range', 2000, 3000),
    students: expects('each', expects('range', 1, 100))
  }));

  // Represents a class that a user is in. Specifies the privileges that the
  // user has for that class.
  ClassUser = new Meteor.Collection("class-user");

  // Represents a particular test. Associated with a class.
  Exam = new CollectionSchema('exam', expects('schema', {
    name: expects('length', 1, 200),
    examPath: expects('length', 1, 1000),
    solutionsPath: expects('optional', expects('length', 1, 1000))
  }));

  // Represents a particular question and part. Also holds an array of rubrics.
  // Associated with an exam.
  QuestionPart = new CollectionSchema('question-part', expects('schema', {
    examId: expects('length', 1, 200),
    questionNum: expects(Number, 'present'),
    rubrics: expects('each', expects('schema', {
      questionPartId: expects('length', 1, 200),
      rubricNum: expects(Number, 'present'),
      points: expects(Number, 'present'),
      description: expects('length', 1, 1000)
    }))
  }));

  // Represents a student's exam.
  ExamAnswer = new CollectionSchema('exam-answer', expects('schema', {
    userId: expects('length', 1, 200),
    examId: expects('length', 1, 200),
    examPath: expects('length', 1, 1000)
  }));

  // Represents a student's answer to a question part. Also contains the rubrics
  // that have been selected. Associated with a questionpart answer.
  QuestionPartAnswer = new CollectionSchema('question-part-answer', expects('schema', {
    examAnswerId: expects('length', 1, 200),
    questionPartId: expects('length', 1, 200),
    questionNum: expects(Number, 'present'),
    partNum: expects(Number, 'present'),
    graderComments: expects('length', 1, 2000),
    gradedRubrics: expects('schema', {
      questionPartAnswerId: expects('length', 1, 200),
      rubricId: expects('length', 1, 200),
      customPoints: expects(Number)
    })
  }));
});

// TODO: Remove
// var examId = Exam.insert({
//   name: "CS144",
//   sampleAnswerPath: "/pdf/solutions-cs144.pdf"
// });

// var questionPartId = QuestionPart.insert({
//   examId: examId,
//   questionNum: 1,
//   partNum: 1,
//   maxPoints: 10
// });

// var questionPartId2 = QuestionPart.insert({
//   examId: examId,
//   questionNum: 1,
//   partNum: 2,
//   maxPoints: 10
// });

// var rubricId = Rubric.insert({
//   questionPartId: questionPartId,
//   rubricNum: 1,
//   points: -5,
//   description: "Did not give correct explanation"
// });

// // Rubrics that were not chosen
// Rubric.insert({
//   questionPartId: questionPartId,
//   rubricNum: 2,
//   points: 0,
//   description: "Correct answer"
// });

// Rubric.insert({
//   questionPartId: questionPartId,
//   rubricNum: 3,
//   description: "Custom Score"
// });

// var examAnswerId = ExamAnswer.insert({
//   userId: Meteor.userId(),
//   examId: examId,
//   examPath: "/pdf/cglu-cs144.pdf"
// });

// var questionPartAnswerId = QuestionPartAnswer.insert({
//   examAnswerId: examAnswerId,
//   questionPartId: questionPartId,
//   questionNum: 1,
//   partNum: 1,
//   graderComments: "Correct answer but incorrect explanation."
// });

// var gradedRubricId = GradedRubric.insert({
//   questionPartAnswerId: questionPartAnswerId,
//   rubricId: rubricId,
// });


// var questionPartId = QuestionPart.insert({
//   examId: examId,
//   questionNum: 1,
//   partNum: 2,
//   maxPoints: 10
// });

// Rubric.insert({
//   questionPartId: questionPartId,
//   rubricNum: 1,
//   points: -10,
//   description: "Wrong answer"
// });

// // Rubrics that were not chosen
// var rubricId = Rubric.insert({
//   questionPartId: questionPartId,
//   rubricNum: 2,
//   points: -1,
//   description: "Mostly correct answer"
// });

// Rubric.insert({
//   questionPartId: questionPartId,
//   rubricNum: 3,
//   description: "Custom Score"
// });

// var questionPartAnswerId = QuestionPartAnswer.insert({
//   examAnswerId: examAnswerId,
//   questionPartId: questionPartId,
//   questionNum: 1,
//   partNum: 2,
//   graderComments: ""
// });

// var gradedRubricId = GradedRubric.insert({
//   questionPartAnswerId: questionPartAnswerId,
//   rubricId: rubricId,
// });

