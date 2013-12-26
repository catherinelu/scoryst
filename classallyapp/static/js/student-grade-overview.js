$(function() {
  var $examSummary = $('.exam-summary');  // Exam summary table.
  var $student = $('.student');

  // Creates the initial exam summary.
  var curUserId = $student.attr('data-user-id');
  console.log('curUserId: ' + curUserId);
  var curExamId = $examSummary.find('li.active').children().attr('data-exam-id');
  renderExamSummary(curUserId, curExamId);

  // When an exam pill is clicked, update the exam summary.
  $examSummary.on('click', 'li', function(event) {
    var $target = $(event.target);
    $examSummary.find('li').removeClass('active');
    curExamId = $target.attr('data-exam-id');
    renderExamSummary(curUserId, curExamId);
    $target.parent('li').addClass('active');
  });
});
