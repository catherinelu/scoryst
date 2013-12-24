$(function() {
  var $studentsTemplate = $('.students-template');
  var $examTemplate = $('.exam-template');

  var templates = {
    renderExamTemplate: Handlebars.compile($examTemplate.html())
  };

  var $students = $('.nav-pills.nav-stacked');  // List of students container.
  var $examSummary = $('.exam-summary');  // Exam summary table.

  // Get JSON data back to render the exam breakdown for the selected student.
  function renderExamSummary(userId, examId) {
    $.ajax({
      url: 'get-user-exam-summary/' + userId + '/' + examId,
      dataType: 'json'
    }).done(function(data) {
      $('table').html(templates.renderExamTemplate(data));
    }).fail(function(request, error) {
      console.log('Error while getting exam summary data: ' + error);
    });
  }

  // Creates the initial exam summary.
  var curUserId = $students.find('li.active').children().attr('data-user-id');
  var curExamId = $examSummary.find('li.active').children().attr('data-exam-id');
  renderExamSummary(curUserId, curExamId);

  // When a student is clicked, refresh the exam summary.
  $students.click(function(event) {
    var $target = $(event.target);
    $students.children('li').removeClass('active');
    curUserId = $target.attr('data-user-id');
    renderExamSummary(curUserId, curExamId);
    $target.parent('li').addClass('active');
  });

  // When a button is clicked, go to the correct grade page.
  $examSummary.on('click', 'button', function(event) {
    var $target = $(event.target);
    var questionNum = parseInt($target.parents('tr').attr('data-question'));
    var partNum = parseInt($target.parents('tr').attr('data-part'));
    var examId = $target.parents('tbody').attr('data-exam-answer-id');
    $.cookie('curQuestionNum', questionNum, { expires: 1, path: '/' });
    $.cookie('curPartNum', partNum, { expires: 1, path: '/' });
    window.location = examId;
  });

  // When an exam pill is clicked, update the exam summary.
  $examSummary.on('click', 'li', function(event) {
    var $target = $(event.target);
    $examSummary.find('li').removeClass('active');
    curExamId = $target.attr('data-exam-id');
    renderExamSummary(curUserId, curExamId);
    $target.parent('li').addClass('active');
  });

});
