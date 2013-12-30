$(function() {
  var $students = $('.nav-pills.nav-stacked');  // List of students container.
  var $examSummary = $('.exam-summary');  // Exam summary table.
  var $main = $('.main');

  var $confirmReleaseTemplate = $('.confirm-release-template');

  // Creates the initial exam summary.
  var curUserId = $students.find('li.active').children().attr('data-user-id');
  var curExamId = $examSummary.find('li.active').children().attr('data-exam-id');
  
  // Create initial release popover
  var releasePopover = new PopoverConfirm($confirmReleaseTemplate,
    'release-grades', 'cancel-release', curExamId + '/release/');
  
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

    // Update the release grades link
    releasePopover.updateLink(curExamId + '/release/');
    
    renderExamSummary(curUserId, curExamId);
    $target.parent('li').addClass('active');
  });

  // Calculates the height that the student list should be to fit the screen
  // exactly. Measures the main container's height and subtracts the top offset
  // where the scrollable list begins and the bottom margin.
  function resizeStudentsList() {
    var maxHeight = $main.height() - $('.students-scroll').offset().top -
      parseInt($('.container.grade-overview').css('margin-bottom'), 10);
    $('.student-list .students-scroll').css({'max-height': maxHeight + 'px'});
  }
  resizeStudentsList();

});
