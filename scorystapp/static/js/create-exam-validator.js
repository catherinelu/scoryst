$(function() {
  // The validation process is a bit complicated. Firstly, if any question
  // is completely empty (nothing filled in at all), we ignore it and delete it.
  // We do the same if any part is completely empty or any rubric is completely empty
  // 
  // Now, once that is done, we report errors if
  // - Nothing entered at all
  // - Partially entered question/part/rubric
  window.validateRubrics = function(questions) {
    // If a question is empty, replace it with null. We will delete it at the end.
    nullifyEmptyList(questions, isQuestionEmpty);
    
    // Nothing entered at all
    if (isEmpty(questions)) {
      return 'Please fill in the rubrics!';
    }

    for (var i = 0; i < questions.length; i++) {
      var question = questions[i];
      // Ignore the questions that will be deleted
      if (question === null) {
        continue;
      }

      // Nullify all the empty parts in the question
      nullifyEmptyList(question, isPartEmpty);

      for (var j = 0; j < question.length; j++) {
        var part = question[j];
        // Ignore the parts that will be deleted
        if (part === null) {
          continue;
        }

        if (isNaN(part.points) || isIntegerArrayInvalid(part.pages)) {
          return 'Please fix question: ' + (i + 1) + ' part: ' + (j + 1);
        }

        nullifyEmptyList(part.rubrics, isRubricEmpty);

        if (isEmpty(part.rubrics)) {
          return 'No rubrics entered for question: ' + (i + 1) 
                  + ' part: ' + (j + 1);
        }

        for (var k = 0; k < part.rubrics.length; k++) {
          var rubric = part.rubrics[k];
          if (rubric === null) {
            continue;
          }
          if (rubric.description === '' || isNaN(rubric.points)) {
            return 'Please fix question: ' + (i + 1) + ' part: ' + (j + 1) + 
                   ' rubric: ' + (k + 1);
          }
        }
      }
    }

    // Time to delete everything that was made null
    removeEmptyList(questions);
    for (var i = questions.length - 1; i >= 0; i--) {
      removeEmptyList(questions[i]);
      for (var j = questions[i].length - 1; j >= 0; j--) {
        removeEmptyList(questions[i][j].rubrics);
      }
    }
    return '';
  }

  // Nullifies each element of the list for which emptyFn(list_element)
  // returns true
  function nullifyEmptyList(list, emptyFn) {
    for (var i = 0; i < list.length; i++) {
      if (emptyFn(list[i])) {
        list[i] = null;
      }
    }
  }

  function isEmpty(list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i] !== null) {
        return false;
      }
    }
    return true;
  }

  function removeEmptyList(list) {
    for (var i = list.length - 1; i >= 0; i--) {
      if (list[i] === null) {
        list.splice(i, 1);
      }
    }
  }

  function isQuestionEmpty(question) {
    for (var i = 0; i < question.length; i++) {
      if (!isPartEmpty(question[i])) {
        return false;
      }
    }
    return true;
  }

  function isPartEmpty(part) {
    return (isNaN(part.points) && isIntegerArrayInvalid(part.pages) && 
            allRubricsEmpty(part.rubrics));
  }

  function allRubricsEmpty(rubrics) {
    for (var i = 0; i < rubrics.length; i++) {
      if (!isRubricEmpty(rubrics[i])) {
        return false;
      }
    }
    return true;
  }

  function isRubricEmpty(rubric) {
    return isBlank(rubric.description) && isNaN(rubric.points);
  }

  // Returns true if any entry of the array is NaN
  function isIntegerArrayInvalid(arr) {
    if (arr.length === 0) return true;
    for (var i = 0; i < arr.length; i++) {
      if (isNaN(arr[i])) {
        return true;
      }
    }
    return false;
  }

  function isBlank(str) {
    return (!str || /^\s*$/.test(str));
  }

});
