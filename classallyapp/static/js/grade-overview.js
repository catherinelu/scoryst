$(function() {
  var $studentsTemplate = $('.students-template');
  var $examTemplate = $('.exam-template');

  var templates = {
    renderExamTemplate: Handlebars.compile($examTemplate.html())
  };

  // TODO: Replace with renderStudents() and renderExamSummary().
  $('tbody').html(templates.renderExamTemplate());

  // Get JSON data back to render the exam breakdown for the selected student.
  function renderExamSummary() {
    $.ajax({
      url: 'get-exam-summary/' + $('.nav-pills a').attr('data-user-id'),
      dataType: 'json'
    }).done(function(data) {
      $('tbody').html(templates.renderExamTemplate(data));
    }).fail(function(request, error) {
      console.log('Error while getting exam summary data: ' + error);
    });
  }
});
