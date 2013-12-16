// Do not touch unless you're sure what you're doing.
validateRubrics = function(questionsJson) {
  // If a question is empty, replace it with null. We will delete it at the end.
  nullifyEmptyJson(questionsJson, isQuestionEmpty);
  
  // Nothing entered at all
  if (isEmpty(questionsJson)) {
    return "Please fill in the rubrics!";
  }

  for (var i = 0; i < questionsJson.length; i++) {
    var questionJson = questionsJson[i];
    // Ignore the questions that will be deleted
    if (questionJson === null) {
      continue;
    }

    // Nullify all the empty parts in the question
    nullifyEmptyJson(questionJson, isPartEmpty);

    for (var j = 0; j < questionJson.length; j++) {
      var partJson = questionJson[j];
      // Ignore the parts that will be deleted
      if (partJson === null) {
        continue;
      }
      if (isNaN(partJson.points) || isArrayInvalid(partJson.pages)) {
        return "Please fix question: " + (i + 1) + " part: " + (j + 1);
      }

      nullifyEmptyJson(partJson.rubrics, isRubricEmpty);

      if (isEmpty(partJson.rubrics)) {
        return "No rubrics entered for question: " + (i + 1) 
                + " part: " + (j + 1);
      }

      for (var k = 0; k < partJson.rubrics.length; k++) {
        var rubric = partJson.rubrics[k];
        if (rubric === null) {
          continue;
        }
        if (rubric.description === "" || isNaN(rubric.points)) {
          return "Please fix question: " + (i + 1) + " part: " + (j + 1) + 
                 " rubric: " + (k + 1);
        }
      }
    }
  }

  // Time to delete everything that was made null
  removeEmptyJson(questionsJson);
  for (var i = questionsJson.length - 1; i >= 0; i--) {
    removeEmptyJson(questionsJson[i]);
    for (var j = questionsJson[i].length - 1; j >= 0; j--) {
      removeEmptyJson(questionsJson[i][j].rubrics);
    }
  }
  return "";
}

function nullifyEmptyJson(json, emptyFn) {
  for (var i = 0; i < json.length; i++) {
    if (emptyFn(json[i])) {
      json[i] = null;
    }
  }
}

function isEmpty(json) {
  for (var i = 0; i < json.length; i++) {
    if (json[i] !== null) {
      return false;
    }
  }
  return true;
}

function removeEmptyJson(json) {
  for (var i = json.length - 1; i >= 0; i--) {
    if (json[i] === null) {
      json.splice(i, 1);
    }
  }
}

function isQuestionEmpty(questionJson) {
  for (var i = 0; i < questionJson.length; i++) {
    if (!isPartEmpty(questionJson[i])) {
      return false;
    }
  }
  return true;
}

function isPartEmpty(partJson) {
  return (isNaN(partJson.points) && isArrayInvalid(partJson.pages) && 
          allRubricsEmpty(partJson.rubrics));
}

function allRubricsEmpty(rubricsJson) {
  for (var i = 0; i < rubricsJson.length; i++) {
    if (!isRubricEmpty(rubricsJson[i])) {
      return false;
    }
  }
  return true;
}

function isRubricEmpty(rubricJson) {
  return rubricJson.description === "" && isNaN(rubricJson.points);
}

function isArrayInvalid(arr) {
  if (arr.length === 0) return true;
  for (var i = 0; i < arr.length; i++) {
    if (isNaN(arr[i])) {
      return true;
    }
  }
  return false;
}