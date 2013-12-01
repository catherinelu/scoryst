// Do not touch unless you're sure what you're doing.
validateRubrics = function(questionsJSON) {
  // If a question is empty, replace it with null. We will delete it at the end.
  nullifyEmptyJSON(questionsJSON, isQuestionEmpty);
  
  // Nothing entered at all
  if (isEmpty(questionsJSON)) {
    return "Please fill in the rubrics!";
  }

  for (var i = 0; i < questionsJSON.length; i++) {
    var questionJSON = questionsJSON[i];
    // Ignore the questions that will be deleted
    if (questionJSON === null) {
      continue;
    }

    // Nullify all the empty parts in the question
    nullifyEmptyJSON(questionJSON, isPartEmpty);

    for (var j = 0; j < questionJSON.length; j++) {
      var partJSON = questionJSON[j];
      // Ignore the parts that will be deleted
      if (partJSON === null) {
        continue;
      }
      if (isNaN(partJSON.points) || isArrayInvalid(partJSON.pages)) {
        return "Please fix question: " + (i + 1) + " part: " + (j + 1);
      }

      nullifyEmptyJSON(partJSON.rubrics, isRubricEmpty);

      if (isEmpty(partJSON.rubrics)) {
        return "No rubrics entered for question: " + (i + 1) 
                + " part: " + (j + 1);
      }

      for (var k = 0; k < partJSON.rubrics.length; k++) {
        var rubric = partJSON.rubrics[k];
        if (rubric === null) {
          continue;
        }
        if (rubric.description === "" || isNaN(rubric.points)) {
          return "Please fix question: " + (i + 1) + "part: " + (j + 1) + 
                 " rubric: " + (k + 1);
        }
      }
    }
  }

  // Time to delete everything that was made null
  removeEmptyJSON(questionsJSON);
  for (var i = questionsJSON.length - 1; i >= 0; i--) {
    removeEmptyJSON(questionsJSON[i]);
    for (var j = questionsJSON[i].length - 1; j >= 0; j--) {
      removeEmptyJSON(questionsJSON[i][j].rubrics);
    }
  }
  return "";
}

function nullifyEmptyJSON(json, emptyFn) {
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

function removeEmptyJSON(json) {
  for (var i = json.length - 1; i >= 0; i--) {
    if (json[i] === null) {
      json.splice(i, 1);
    }
  }
}

function isQuestionEmpty(questionJSON) {
  for (var i = 0; i < questionJSON.length; i++) {
    if (!isPartEmpty(questionJSON[i])) {
      return false;
    }
  }
  return true;
}

function isPartEmpty(partJSON) {
  return (isNaN(partJSON.points) && isArrayInvalid(partJSON.pages) && 
          allRubricsEmpty(partJSON.rubrics));
}

function allRubricsEmpty(rubricsJSON) {
  for (var i = 0; i < rubricsJSON.length; i++) {
    if (!isRubricEmpty(rubricsJSON[i])) {
      return false;
    }
  }
  return true;
}

function isRubricEmpty(rubricJSON) {
  return rubricJSON.description === "" && isNaN(rubricJSON.points);
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