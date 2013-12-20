$(function() {
  var $studentsTemplate = $('.students-template');
  var $examTemplate = $('.exam-template');

  var templates = {
    renderStudentsTemplate: Handlebars.compile($studentsTemplate.html()),
    renderExamTemplate: Handlebars.compile($examTemplate.html()),
  };

  // TODO: Replace with renderStudents() and renderExamSummary().
  $('.nav-stacked').html(templates.renderStudentsTemplate());
  $('tbody').html(templates.renderExamTemplate());

  // Get JSON data back to render the list of students.
  function renderStudents() {
    $.ajax({
      url: 'get-students-exam-summary/',
      dataType: 'json',
    }).done(function(data) {
      $('.nav-stacked').html(templates.renderStudentsTemplate(data));
    }).fail(function(request, error) {
      console.log('Error while getting students exam summary data: ' + error);
    });
  }

  // Get JSON data back to render the exam breakdown for the selected student.
  function renderExamSummary() {
    $.ajax({
      url: 'get-exam-summary/',
      dataType: 'json',
    }).done(function(data) {
      $('tbody').html(templates.renderExamTemplate(data));
    }).fail(function(request, error) {
      console.log('Error while getting exam summary data: ' + error);
    });
  }
});