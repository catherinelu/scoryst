Meteor.startup(function() {
  // Represents a class.
  Class = new Meteor.Collection("class");

  // Represents a class that a user is in. Specifies the privileges that the
  // user has for that class.
  ClassUser = new Meteor.Collection("class-user");

  // Represents a particular test. Associated with a class.
  Exam = new Meteor.Collection("exam");

  // Represents a particular question and part. Associated with an exam.
  QuestionPart = new Meteor.Collection("question-part");

  // Represents a grading rubric. Associated with a question.
  Rubric = new Meteor.Collection("rubric");

  // Represents a student's exam.
  ExamAnswer = new Meteor.Collection("exam-answer");

  // Represents a student's answer to a question part
  QuestionPartAnswer = new Meteor.Collection("question-part-answer");

  GradedRubric = new Meteor.Collection("graded-rubric");
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

// var rubricId = Rubric.insert({
//   questionPartId: questionPartId,
//   points: -5,
//   description: "Did not give correct explanation"
// });

// // // Rubric that was not chosen
// Rubric.insert({
//   questionPartId: questionPartId,
//   points: 0,
//   description: "Correct answer"
// });

// var userExamId = ExamAnswer.insert({
//   userId: Meteor.userId(),
//   examId: examId,
//   examPath: "/pdf/cglu-cs144.pdf"
// });

// var questionPartAnswerId = QuestionPartAnswer.insert({
//   examAnswerId: userExamId,
//   questionPartId: questionPartId,
//   graded: true,
//   graderComments: "Correct answer but incorrect explanation."
// });

// var gradedRubricId = GradedRubric.insert({
//   questionPartAnswerId: questionPartAnswerId,
//   rubricId: rubricId,
// });