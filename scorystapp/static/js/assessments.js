$(function() {
  var infoPopoverText = 'Once students have been assigned to an exam, that exam' +
    ' can no longer be edited or deleted';

  var $infoPopover = $('.info-popover');
  $infoPopover.popover({ content: infoPopoverText });

  var $delete = $('.delete');
  // Create the popover to warn deletion from roster
  $delete.popoverConfirm();

  var $assessmentType = $('input[type="radio"]');
  var $examFields = $('.exam-fields');

  // when assessment type is exam, show exam fields; hide them otherwise
  toggleExamFields();
  $assessmentType.change(toggleExamFields);
  a = $assessmentType;

  /* Toggles the exam fields based on the selected assessment type. */
  function toggleExamFields() {
    if ($('input[type="radio"]:checked').val() === 'exam') {
      $('.homework-fields').hide();
      $('.exam-fields').show();
      $('#id_name').attr('placeholder', 'Midterm Exam');
    } else {
      $('.homework-fields').show();
      $('.exam-fields').hide();
      $('#id_name').attr('placeholder', 'Problem Set 1');
    }
  }

  /* Initialize the datetime picker. */
  $('#id_submission_deadline_picker').datetimepicker({'format': 'MM/DD/YYYY HH:mm'});

});
