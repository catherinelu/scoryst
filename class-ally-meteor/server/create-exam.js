Meteor.methods({
  /* Creates rubrics for an exam.
   *
   * Arguments:
   * examName -- the fields for the user that'll be created
   * questionsJson -- the JSON associated with the questions to be
   * added to the database
   * TODO: Permissions - exam belongs to given class etc etc.
   * TODO: pdffile upload
   */
  createRubricsForExam: function(examName, questionsJson, pdfFilePath) {
    var errorMessage = validateRubrics(questionsJson);
    if (errorMessage !== "") {
      return errorMessage;
    }

    // TODO: If an exam with this name and this classId already exists
    // then delete everything to do with it 
    // Otherwise, throw an error saying exam with this name already exists,
    // asking if they wish to overwrite or what
    var examId = Exam.insert({
      classId: undefined,
      name: examName,
      sampleAnswerPath: pdfFilePath,
      emptyExamPath: pdfFilePath,
    });

    var numQuestions = questionsJson.length;
    for (var i = 0; i < numQuestions; i++) {
      for (var j = 0; j < questionsJson[i].length; j++) {
        var questionPartId = QuestionPart.insert({
          examId: examId,
          questionNum: i + 1,
          partNum: j + 1,
          maxPoints: questionsJson[i][j].points,
          pages: questionsJson[i][j].pages
        });

        var rubrics = questionsJson[i][j].rubrics
        for (var k = 0; k < rubrics.length; k++) {
          Rubric.insert({
            questionPartId: questionPartId,
            description: rubrics[k].description,
            points: rubrics[k].points 
          });
        }
      }
    }
    return true;
  }
});
