$(function() {
  var $students = $('.nav-pills.nav-stacked');  // List of students container.
  var $examSummary = $('.exam-summary');  // Exam summary table.
  var $main = $('.main');
  var $exams = $('.nav.nav-tabs');
  var $examOverview = $('.exam-overview');

  var $examOverviewTemplate = $('.exam-overview-template');
  var templates = {
    renderExamOverviewTemplate: Handlebars.compile($examOverviewTemplate.html())
  };

  // Creates the initial exam summary.
  var curUserId = $students.find('li.active').children().attr('data-user-id');
  var curExamId = $exams.find('li.active').children().attr('data-exam-id');
  
  renderExamSummary(curUserId, curExamId);

  function renderExamsOverview() {
    $.ajax({
      url: curExamId + '/get-overview/',
      dataType: 'json'
    }).done(function(data) {
      // Add the examId to be sent to handlebars
      data['examId'] = curExamId;
      $examOverview.html(templates.renderExamOverviewTemplate(data));
      
      // Create release popover
      $('.release-grades').popoverConfirm({
        handlebarsTemplateSelector: '.confirm-release-template', 
        cancelSelector: '.cancel-release',
        link: curExamId + '/release/',
        placement: 'left'
      });

    }).fail(function(request, error) {
      console.log('Error while getting exams overview data: ' + error);
    });
  }

  renderExamsOverview();

  // When a student is clicked, refresh the exam summary.
  $students.on('click', 'a', function(event) {
    event.preventDefault();
    var $studentLink = $(event.currentTarget);
    curUserId = $studentLink.attr('data-user-id');

    $students.children('li').removeClass('active');
    renderExamSummary(curUserId, curExamId);
    $studentLink.parents('li').addClass('active');
  });

  // When an exam tab is clicked, update the exam summary.
  $exams.on('click', 'a', function(event) {
    event.preventDefault();
    var $li = $(event.currentTarget);

    $exams.find('li').removeClass('active');
    curExamId = $li.find('a').attr('data-exam-id');

    renderExamSummary(curUserId, curExamId);
    $li.addClass('active');
    renderExamsOverview();
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
