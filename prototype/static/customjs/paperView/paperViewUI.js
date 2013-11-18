var keyToRubricIDMap = {};
var rubricIDToJSONMap = {};
var currPart;
var pageNum = 1;
var studentView = false;
var url = 'http://localhost:7777/static/pdf/CGLU_CS144.pdf',
    pdfDoc = null;

$(document).ready(function() {
  // Disable workers to avoid yet another cross-origin issue(workers need URL of
  // the script to be loaded, and currently do not allow cross-origin scripts)
  PDFJS.disableWorker = true;
  var jsonURL = Utility.getQueryVariable("json");
  // TODO: Give error message
  if (jsonURL == -1) {
    jsonURL = "static/json/CGLU_CS144.json";
  } else {
    jsonURL = "static/json/" + jsonURL;
  }
  var pdfURL = Utility.getQueryVariable("pdf");
  if (pdfURL !== -1) {
    url = "static/pdf/" + pdfURL;
  }
  // Asynchronously download PDF as an ArrayBuffer
  PDFJS.getDocument(url).then(
    function getPdf(_pdfDoc) {
      pdfDoc = _pdfDoc;
      // Once the pdf buffer is ready, get the associated JSON and create the UI
      makeAjaxCall (jsonURL, initPageUI, alert);
    },
    function getPdfError(message, exception) {
      alert(message);
    }
  );
});

function initPageUI(jsonResponse) {
  RESP = jsonResponse
  var STUDENT_NAME_ID_SEL = "#student_name",
      STUDENT_SCORE_ID_SEL = "#student_score",
      QUESTIONS_LIST_SEL = "#questions_nav_list";

  studentView = jsonResponse.studentView;

  var currQuestionIndex = Utility.getQueryVariable("q");
  var currPartIndex = Utility.getQueryVariable("p");

  if (currQuestionIndex < 0 || currPartIndex < 0) {
    currQuestionIndex = 0;
    currPartIndex = 0;
  }
  
  $(STUDENT_NAME_ID_SEL).html(jsonResponse.firstName + " " + jsonResponse.lastName);
  
  var score = "ungraded"
  if (jsonResponse.graded) {
    score = jsonResponse.pointsScored;
  }
  $(STUDENT_SCORE_ID_SEL).html(score + "/" + jsonResponse.maxScore);
  
  var prev_id, next_id;
  var questions = jsonResponse.questions;
  
  for(var i = 0; i < questions.length; i++) {
    var headerLi = $(document.createElement("li"));
    headerLi.addClass("nav-header");
    headerLi.append("Question " + (i + 1));
    
    $(QUESTIONS_LIST_SEL).append(headerLi);
    for(var j = 0; j < questions[i].parts.length; j++) {
      // Creating a closure scope
      (function () {
        var part = questions[i].parts[j];
        var partLi = $(document.createElement("li"));
        if (j == 0 && i == 0) {
          partLi.addClass("active_part");
        }
        var partAnchor = $(document.createElement("a"));
        function getPartAnchorIDs(i, j) {
          var partAnchorID, prevPartAnchorID, nextPartAnchorID;

          var partAnchorId = "question_" + (i + 1) + "_part_" + (j + 1);
          // First question, no prev
          if (i == 0 && j == 0) {
            prevPartAnchorID = undefined;
          }
          else if (j == 0) {
            prevPartAnchorID = "question_" + i + "_part_" + questions[i-1].parts.length;
          }
          else {
            prevPartAnchorID = "question_" + (i + 1) + "_part_" + j;
          }

          if (j == questions[i].parts.length - 1 && i == questions.length - 1) {
            nextPartAnchorID = undefined;
          } 
          else if (j == questions[i].parts.length - 1) {
            nextPartAnchorID = "question_" + (i + 2) + "_part_" + 1;
          }
          else {
            nextPartAnchorID = "question_" + (i + 1) + "_part_" + (j + 2);
          }
          return {
            "prev": prevPartAnchorID, 
            "curr": partAnchorId, 
            "next": nextPartAnchorID
          };
        }

        var partAnchorIDs = getPartAnchorIDs (i, j);

        partAnchor.attr("id", partAnchorIDs.curr);
        partAnchor.append("Part " + (j + 1));
        partLi.append(partAnchor);
        $(QUESTIONS_LIST_SEL).append(partLi);
        part.IDs = partAnchorIDs;
        part.question = questions[i];
        part.question_index = i;
        part.part_index = j;

        updateScore(part);
        partAnchorSelector = "#" + partAnchorIDs.curr;
        

        $(partAnchorSelector).click(function() {
          $(QUESTIONS_LIST_SEL).children().removeClass("active_part");
          $(this).parent().addClass("active_part");
          updatePartBeingShown(part);
        });

        if (i == currQuestionIndex && j == currPartIndex) {
          $(partAnchorSelector).click();
        }
      }());
    }
  }
  updateScore(currPart);

  // Accordian for the shortcut table
  $("#toggle_shortcut_table").click(function(){
    $("#shortcut_table").slideToggle(0);
  });
}

function updatePartBeingShown(part, last) {
  for (var i = 0; currPart && i < currPart.rubric.length; i++) {
    $("#rubric_" + i).unbind("click");  
  }
  currPart = part;

  var RUBRICS_LIST = "#rubrics_nav_list";
  pageNum = part.pages[0];
  renderPage(pageNum);
  var asciia = 65;

  $(RUBRICS_LIST).html("");
  for(i = 0; i < part.rubric.length; i++) {
    (function () {

      var rubric = part.rubric[i];
      var rubricLi = $(document.createElement("li"));
      var rubric_id = "custom_rubric";
      var rubric_id_selector = "#" + rubric_id;
      var selected_rubric_class = "rubric_selected";
      
      $(RUBRICS_LIST).append(rubricLi);
      rubricLi.addClass("rubric");
      rubricLi.attr("id", "rubric_" + i);
      
      var option = String.fromCharCode(asciia + i);
      
      if (i !== part.rubric.length - 1) {
        rubricLi.append("<b>" + option + ".</b> " + rubric.reason + ": " + rubric.points);
        keyToRubricIDMap[asciia + i] = "#rubric_" + i;
      } else {
        rubricLi.append(option + ". " + rubric.reason + ": ");
        var disabled = "";
        if (studentView) {
          // Spacing before and after needed for spacing in html
          disabled = " disabled ";
        }
        var input = "<input type='text'" + disabled + "id='" + rubric_id + "'/>";
        rubricLi.append(input);
        if (rubric.checked) {
          $(rubric_id_selector).val(rubric.points);
          rubricLi.addClass(selected_rubric_class);
        }
        
        $(rubric_id_selector).on("input", function() {
          var value = $(rubric_id_selector).val();
          if (isNaN(parseFloat(value)) || isNaN(value)) {
            rubricLi.removeClass(selected_rubric_class);
            rubric.checked = false;
            rubric.points = 0;
          }
          else {
            rubricLi.addClass(selected_rubric_class);
            rubric.checked = true;
            rubric.points = parseFloat(value);
          }
          updateScore(part);
        });
      }
      
      var rubric = part.rubric[i];
      if (rubric.checked) {
        rubricLi.addClass(selected_rubric_class); 
      }
      
      // Don't do the on click for the custom score
      if (i == part.rubric.length - 1) return;

      $("#rubric_" + i).click(function () {
        if (studentView) return;
        if (rubricLi.hasClass(selected_rubric_class)) {
          rubricLi.removeClass(selected_rubric_class);
          rubric.checked = false;
        }
        else {
          rubricLi.addClass(selected_rubric_class); 
          rubric.checked = true;   
        }
        updateScore(part);
      });
    })();
  }
  updateScore(currPart);
  updateComment();
  updateRegradeHistory();
}

function updateRegradeHistory() {
  var REGRADE_DIV_INFO_SELECTOR = "#regrade_info_div";
  $(REGRADE_DIV_INFO_SELECTOR).html("");
  if (currPart.regradeInfo === undefined) return;
  for (var i = 0; i < currPart.regradeInfo.length; i++) {
    $(REGRADE_DIV_INFO_SELECTOR).append(currPart.regradeInfo[i].regradeRequestReasons);
    if (studentView) {

    } else {

    }
  }
}

$("#regrade").click(function(){
  var regradeModalSelector = "#regradeModal";
  $(regradeModalSelector).modal();
  $("#regrade_textarea").val("Please explain your reasons for wanting a " + 
                             "regrade on this particular part of this question");
  $("#regrade_submit").click(function() {
    if (currPart.regradeInfo === undefined) {
      currPart.regradeInfo = [];
    }
    var info = {};
    info.resolved = false;
    info.regradeRequestReasons = $("#regrade_textarea").val();
    info.graderComments = "";
    currPart.regradeInfo.push(info);
    $(regradeModalSelector).modal("hide");
    updateRegradeHistory();
  });
});

function updateComment() {
  var COMMENT_DIV_ID_SELECTOR = "#comments_div";
  editComment();
  if (!Utility.isBlank(currPart.comments)) {
    saveComment(currPart.comments);
  } else {
    editComment();
  }

  function saveComment(comment) {
    cl(comment);
    if (Utility.isBlank(comment)) return;
    currPart.comments = comment;
    $(COMMENT_DIV_ID_SELECTOR).html("<div class='space-4'></div><h4>Comments</h4>");
    $(COMMENT_DIV_ID_SELECTOR).append("<div id='comments'><b>Jason Adams (TA)</b>: " + currPart.comments +"</div>");
    if (studentView) return;
    var editCommentBtnHTML = "<div class='space-6'></div><div class='center'><button id='edit_comment_btn' class='btn btn-sm btn-primary center'>Edit Comment</button></div>";
    $(COMMENT_DIV_ID_SELECTOR).append(editCommentBtnHTML);
    $("#edit_comment_btn").click(function (){
      editComment();
    });
  }

  function editComment() {
    var comment = currPart.comments || "";
    $(COMMENT_DIV_ID_SELECTOR).html("");
    if (studentView) return;
    var commentsTextHTML = "<textarea id='textarea_comments' placeholder='Add any comments'>"
                       + comment + "</textarea>";
    $(COMMENT_DIV_ID_SELECTOR).append(commentsTextHTML);
    var commentsButtonHTML = "<div class='space-6'></div><div class='center'><button id='save_comment_btn' class='btn btn-sm btn-primary center'>Save Comment</button></div>";
    $(COMMENT_DIV_ID_SELECTOR).append(commentsButtonHTML);
    $("#save_comment_btn").click(function (){
      saveComment($("#textarea_comments").val());
    });
  }
}
  
function updateScore(part) {
  $("#" + part.IDs.curr).find("span").remove();
  var regrade = "";
  if (part.regradeInfo) {
    for (var i = 0; i < part.regradeInfo.length; i++) {
      if (part.regradeInfo[i].resolved == false) regrade = "REGRADE REQ";
    }
  }
  if (someRubricChecked (part)) {
    // Remove part.maxScore for scoring up instead of down
    score = part.maxScore + getRubricScore (part);
    $("#" + part.IDs.curr).append("<span>" + ": (" + score + "/" + part.maxScore
     + ") " + regrade + "</span>");
    $("#question_score").html(score + "/" + part.maxScore)
  }
  else {
    $("#" + part.IDs.curr).append("<span>" + ": ungraded " + regrade + "</span>");
    $("#question_score").html("ungraded /" + part.maxScore)
  }
}

function someRubricChecked (part) {
  for (var i = 0; i < part.rubric.length; i++) { 
    if (part.rubric[i].checked) return true;
  }
  return false;
}

function getRubricScore (part) {
  var sum = 0;
  for (var i = 0; i < part.rubric.length; i++) { 
    if (part.rubric[i].checked) sum += part.rubric[i].points;
  }
  return sum;
}

$("#pdf_prev_page").click(function(){
  index = currPart.pages.indexOf(pageNum);
  if (currPart.pages[index - 1]) {
    goToPage (currPart.pages[index - 1]);
  }
  else if (currPart.IDs.prev !== undefined) {
    $("#" + currPart.IDs.prev).click();
  }
});

$("#pdf_next_page").click(function(){
  index = currPart.pages.indexOf(pageNum);
  if (currPart.pages[index + 1]) {
    goToPage (currPart.pages[index + 1]);
  }
  else if (currPart.IDs.next !== undefined) {
    $("#" + currPart.IDs.next).click();
  }
});

$("#prev_student").click(function() {
  document.location.href = "/paperViewGrader.html?json=CGLU_CS144.json&pdf=CGLU_CS144.pdf&q="
                            + currPart.question_index + "&p=" + currPart.part_index;
});

$("#next_student").click(function() {
  document.location.href = "/paperViewGrader.html?json=KV_CS144.json&pdf=KV_CS144.pdf&q="
                            + currPart.question_index + "&p=" + currPart.part_index;
});

$(document).keydown(function(e){
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

    if(studentView) return;
    // Up Key
    if (e.keyCode == 38) { 
      $("#prev_student").click();
      return false;
    }
    // Down Key
    if (e.keyCode == 40) { 
       $("#next_student").click();
       return false;
    }

    // Ensure comments textbox is not in focus
    if (keyToRubricIDMap[e.keyCode]) {
      $(keyToRubricIDMap[e.keyCode]).click();
      return false;
    }
});