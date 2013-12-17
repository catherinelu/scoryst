$(function() {
  var $gradeTemplate = $('.grade-template');
  var $examNavTemplate = $('.exam-nav-template');
  var $rubricsNavTemplate = $('.rubrics-nav-template');

  var templates = {
    renderGradeTemplate: Handlebars.compile($gradeTemplate.html()),
    renderExamNavTemplate: Handlebars.compile($examNavTemplate.html()),
    renderRubricsNavTemplate: Handlebars.compile($rubricsNavTemplate.html())
  };

  var url = 'static/pdf/empty-cs221.pdf';
  var pdfDoc = null;
  var curPage = 1;

  var curQuestionNum = 1;
  var curPartNum = 1;
  var lastQuestionNum = 0;

  /* Resizes the page navigation to match the canvas height. */
  function resizePageNavigation() {
    $previousPage.height($canvas.height());
    $nextPage.height($canvas.height());
  }

  $(window).resize(resizePageNavigation);

  /* Get page info, resize canvas accordingly, and render PDF page. */
  function renderPDFPage(num) {
    pdfDoc.getPage(num).then(function(page) {
      var viewport = page.getViewport(PDF_SCALE);
      $canvas.prop('height', viewport.height);
      $canvas.prop('width', viewport.width);

      // Render PDF page into canvas context
      var renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      page.render(renderContext).then(function() {
        resizeNav();
        resizePageNavigation();
      });
    });
  }

  /* Get JSON data back to render the page. First gets the rubrics navigation
     data, then the exam navigation data, and finally passes these two parts to
     the main grade container template to be rendered. */
  console.log("About to do the AJAX calls.");
  $.ajax({
    url: "get-rubrics-nav",
    dataType: "json",
    data: {question: curQuestionNum, part: curPartNum}
  }).done(function(data) {
    console.log("Done with rubrics nav. Data returned: " + data);
    var rubricsNav = templates.renderRubricsNavTemplate();
    $.ajax({
      url: "get-exam-nav",
      dataType: "json",
      data: {question: curQuestionNum, part: curPartNum}
    }).done(function() {
      var examNav = templates.renderExamNavTemplate();
      var gradeData = $('.container.grade').data();
      gradeData.examNav = examNav;
      gradeData.rubricsNav = rubricsNav;
      var grade = templates.renderGradeTemplate(gradeData);
      $('.container .grade').html(grade);
    }).fail(function(request, error) {
      console.log("Error while getting exam nav data: " + error)
    });
  }).fail(function(request, error) {
    console.log("Error while getting rubric nav data: " + error);
  });


  function updateComment() {
    var $commentTextarea = $('.comment-textarea');
    var $saveEditComment = $('.comment-save-edit');
    var disabled = $commentTextarea.prop('disabled');
    // Comment already exists
    if (disabled) {
      $saveEditComment.html("Save comment");
    } else {
      if ($commentTextarea.val() === "") {
        return;
      }
      $saveEditComment.html("Edit comment");
    }
    $commentTextarea.prop('disabled', !disabled);
  }

});
