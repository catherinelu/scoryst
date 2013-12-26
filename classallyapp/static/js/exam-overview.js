// TODO: Share even more code between the two. I'm guessing this can be done
// better using backbone, etc.

var $examTemplate = $('.exam-template');
var templates = {
  renderExamTemplate: Handlebars.compile($examTemplate.html())
};

var $examSummary = $('.exam-summary');  // Exam summary table.

// Get JSON data back to render the exam breakdown for the selected student.
function renderExamSummary(userId, examId) {
  $.ajax({
    url: 'get-user-exam-summary/' + userId + '/' + examId,
    dataType: 'json'
  }).done(function(data) {
    $('.table-container').html(templates.renderExamTemplate(data));
  }).fail(function(request, error) {
    console.log('Error while getting exam summary data: ' + error);
  });
}

// When a button is clicked, go to the correct grade page.
$('.exam-summary').on('click', 'button', function(event) {
  var $target = $(event.target);
  var questionNum = parseInt($target.parents('tr').attr('data-question'));
  var partNum = parseInt($target.parents('tr').attr('data-part'));
  var examId = $target.parents('tbody').attr('data-exam-answer-id');
  $.cookie('curQuestionNum', questionNum, { expires: 1, path: '/' });
  $.cookie('curPartNum', partNum, { expires: 1, path: '/' });
  window.location = examId;
});