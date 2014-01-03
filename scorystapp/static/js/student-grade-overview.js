$(function() {
  var $examSummary = $('.exam-summary');  // Exam summary table.
  var $student = $('.student');
  var $examNav = $('.nav-container .nav-tabs');

  // Creates the initial exam summary.
  var curUserId = $student.attr('data-user-id');
  console.log('curUserId: ' + curUserId);
  var curExamId = $examNav.find('li.active').children().attr('data-exam-id');
  renderExamSummary(curUserId, curExamId);

  // When an exam pill is clicked, update the exam summary.
  $examNav.on('click', 'li', function(event) {
    event.preventDefault();
    var $target = $(event.target);
    $examNav.find('li').removeClass('active');
    curExamId = $target.attr('data-exam-id');
    renderExamSummary(curUserId, curExamId);
    $target.parent('li').addClass('active');
  });
});
