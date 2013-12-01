// Recreates the UI for create-exam.html
recreateExamUI = function() {
  var rubricsJSON = testJSON();

  // TODO: These variables are already in edit-created-exam.js
  // Do we really need declared again?
  
  var $addQuestion = $('.add-question');
  var $addPart = $('.add-part');
  var $addRubric = $('.add-rubric');
  var $questionList = $('.question-list');

  for (var i = 0; i < rubricsJSON.length; i++) {
    for (var j = 0; j < rubricsJSON[i].length; j++) {
      var $partInputs = 
        $questionList.find('input[data-question="' + (i + 1) +
                            '"][data-part="' + (j + 1) + '"]');
      $partInputs.eq(0).val(rubricsJSON[i][j].points);
      $partInputs.eq(1).val(rubricsJSON[i][j].pages);

      // Ugly DOM traversal
      var $next = $partInputs.parent().parent().parent().next();
      for (var k = 0; k < rubricsJSON[i][j].rubrics.length; k++) {
        $partInputs = $next.find('input');
        var rubric = rubricsJSON[i][j].rubrics[k];
        $partInputs.eq(0).val(rubric.description);
        $partInputs.eq(1).val(rubric.points);

        if (k != rubricsJSON[i][j].rubrics.length - 1) {
          $addRubric.click();
          $next = $next.next();
        }
      }
      if (j != rubricsJSON[i].length - 1) {
        $addPart.click();
      }
    }
    if (i != rubricsJSON.length - 1) {
      $addQuestion.click();
    }
  }
}

function makeAjaxCall(url, successFn, failureFn, isAjax) {
  $.ajax({
    type: "get",
    url: url,
    ajax: isAjax !== undefined ? isAjax : true,
    dataType: "json",
    error: function(request, error) {
      if (failureFn) {
        failureFn (error);
      } else {
        alert (error);
      }
    },
    success: function(jsonResponse) {
      successFn (jsonResponse);
    }
  });
}

function testJSON(){
  return [
    [
      {
        "points": 10,
        "pages": [
          1,
          2,
          3
        ],
        "rubrics": [
          {
            "description": "Q1P1 rubric",
            "points": -5
          },
          {
            "description": "Q1P1 rubric 2",
            "points": -2
          }
        ]
      },
      {
        "points": 10,
        "pages": [
          4,
          5,
          6
        ],
        "rubrics": [
          {
            "description": "part 2 rubric",
            "points": -1
          }
        ]
      },
      {
        "points": 5,
        "pages": [
          7
        ],
        "rubrics": [
          {
            "description": "part 3 rubric 1",
            "points": -2
          },
          {
            "description": "part 3 rubric 2",
            "points": -3
          }
        ]
      }
    ],
    [
      {
        "points": 10,
        "pages": [
          8
        ],
        "rubrics": [
          {
            "description": "just one",
            "points": -5
          }
        ]
      }
    ],
    [
      {
        "points": 10,
        "pages": [
          11,
          12
        ],
        "rubrics": [
          {
            "description": "q3 p1 rubric 1",
            "points": 1
          },
          {
            "description": "q3 p1 rubric 2",
            "points": 4
          }
        ]
      }
    ]
  ];
}