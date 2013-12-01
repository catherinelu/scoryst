Meteor.startup(function() {
  // Represents a class.
  Class = new Meteor.Collection("class");

  // Represents a class that a user is in. Specifies the privileges that the
  // user has for that class.
  ClassUser = new Meteor.Collection("classuser");

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
});