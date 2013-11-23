var url = 'http://localhost:7777/static/pdf/CS221_empty.pdf',
    pdfDoc = null,
    currPage = 1,
    lastQuestion = 1;;

$(document).ready(function() {
  PDFJS.disableWorker = true;
  PDFJS.getDocument(url).then(
    function getPdf(_pdfDoc) {
      pdfDoc = _pdfDoc;
      renderPage(currPage);
    },
    function getPdfError(message, exception) {
      alert(message);
    }
  );
  // Init the Rubric display UI
  $("#add_question").click();
});

$("#pdf_prev_page").click(function(){
  if (currPage <= 1) return;
  currPage--;
  goToPage (currPage);
});

$("#pdf_next_page").click(function(){
  if (currPage >= pdfDoc.numPages) return;
  currPage++;
  goToPage (currPage)
});

$(document).keydown(function(e) {
  if(e.target.nodeName == 'INPUT' || e.target.nodeName == 'TEXTAREA') return;
  // Left Key
  if (e.keyCode == 37) { 
     $("#pdf_prev_page").click();
     return false;
  }
  // Right Key
  if (e.keyCode == 39) { 
     $("#pdf_next_page").click();
     return false;
  }
});

$("#add_question").click(function() {
  var currQuestion = lastQuestion;
  var question_li = document.createElement("li");
  $("#questions_div").append(question_li);
  $(question_li).html("<h5>Question " + currQuestion + "</h5>");

  // Unordered list with each part within a question corresponding to a list element
  var part_ul = document.createElement("ul");
  $(question_li).append(part_ul);
  
  var currPart = 1;
  var add_part_btn_id = "add_part_" + currQuestion;
  $(question_li).append("<button id='" + add_part_btn_id + "'>Add part</button>");
  $("#" + add_part_btn_id).click(function() {
    createPart(part_ul, currQuestion, currPart);
    currPart++;
  });
  $("#" + add_part_btn_id).click();
  lastQuestion++;
});

function createPart(part_ul, currQuestion, currPart) {
  $(part_ul).append("<br/><label for='question'" + currQuestion + "_part_" + currPart + "_points'>Part " + currPart + ": </label");
  $(part_ul).append("<input type='text' id='question" + currQuestion + "_part_" + currPart + "_points' placeholder='10 points' style='width:80px;'' />");
  $(part_ul).append("<label for='question" + currQuestion + "_part_" + currPart + "_pages'> on pages: </label>");
  $(part_ul).append("<input type='text' id='question" + currQuestion + "_part_" + currPart + "_pages' placeholder='1, 2, 3' />");
  var div = document.createElement("div");
  $(part_ul).append(div);

  function addRubric() {
    $(div).append("<input type='text' class='rubric_desc' placeholder='Rubric desc'/>");
    $(div).append("<input type='text' class='rubric_points' placeholder='-5 points'/>");
  }
  
  var add_rubric_id = "add_rubric_" + currQuestion + "_" + currPart;
  $(part_ul).append("<a id='" + add_rubric_id + "'><h1>+</h1></a>");
  
  $("#" + add_rubric_id).click(function() {
    addRubric();
  });
  $("#" + add_rubric_id).click();
}

// User is done creating the rubric. Validate it and send over a JSON to backend
$("#rubric_done").click(function() {
  var rubricJSON = {};
  rubricJSON.questions = {};

  for (var i = 1; i < lastQuestion; i++) {
    rubricJSON.questions[i] = {};
    var question = rubricJSON.questions[i];
    
    var numParts = 1;
    while ($("#question" + i + "_part_" + numParts + "_points").length) {
      numParts++;
    }
    for (var j = 1; j < numParts; j++) {
      question[j] = {};
      question[j].points = $("#question" + i + "_part_" + j + "_points").val();
      var pages = $("#question" + i + "_part_" + j + "_pages").val();
      pages.replace(" ", "");
      var nanPage = false;
      pages = pages.split(",").map(function(page) {
        var pageNum = parseInt(page);
        if (isNaN(pageNum)) nanPage = true;
        return parseInt(page);
      });
      if (pages == null) {
        nanPage = true;
      }
      question[j].pages = pages;

      if (question[j].points == "" || nanPage) {
        // If only one of them is messed up, we want to give the error message
        if (question[j].points == "" && nanPage) {
          // It was the last rubric ignore it.
          if (j == numParts - 1) {
            delete question[j];
            break;
          }
        }
        alert("Invalid format, please fix");
      }
      question[j].rubrics = [];

      var rubrics = $("#question" + i + "_part_" + j + "_pages").next().children();
      for (var k = 0; k < rubrics.length; k+=2) {
        var desc = $(rubrics[k]).val();
        var points = parseFloat($(rubrics[k+1]).val());
        if (isNaN(points) || desc == "") {
          // User didn't enter anything. We can't allow k==0 since we need 
          // at least one rubric
          if (isNaN(points) && desc == "" && k) continue;
          alert("Invalid format, please fix");
          return;
        }
        question[j].rubrics.push({"description": desc, "points": points})
      }
    }
  }
});