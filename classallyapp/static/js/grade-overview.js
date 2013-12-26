$(function() {
  var $students = $('.nav-pills.nav-stacked');  // List of students container.
  var $examSummary = $('.exam-summary');  // Exam summary table.

  // Creates the initial exam summary.
  var curUserId = $students.find('li.active').children().attr('data-user-id');
  var curExamId = $examSummary.find('li.active').children().attr('data-exam-id');
  renderExamSummary(curUserId, curExamId);

  // When a student is clicked, refresh the exam summary.
  $students.click(function(event) {
    event.preventDefault();
    var $target = $(event.target);
    var userId = $target.attr('data-user-id');

    if (userId === undefined) return;
    curUserId = userId;

    $students.children('li').removeClass('active');
    renderExamSummary(curUserId, curExamId);
    $target.parent('li').addClass('active');
  });

  // When an exam pill is clicked, update the exam summary.
  $examSummary.on('click', 'li', function(event) {
    event.preventDefault();
    var $target = $(event.target);

    $examSummary.find('li').removeClass('active');
    curExamId = $target.attr('data-exam-id');
    renderExamSummary(curUserId, curExamId);
    $target.parent('li').addClass('active');
  });
});
