$(function() {
  var infoPopoverText = 'Once students have been assigned to an exam, that exam' +
    ' can no longer be edited or deleted';

  var $infoPopover = $('.info-popover');
  $infoPopover.popover({ content: infoPopoverText });

  var $delete = $('.delete');
  // Create the popover to warn deletion from roster
  $delete.popoverConfirm();

  var $assessmentType = $('#id_assessment_type');
  var $examFields = $('.exam-fields');

  // when assessment type is exam, show exam fields; hide them otherwise
  toggleExamFields();
  $assessmentType.change(toggleExamFields);

  /* Toggles the exam fields based on the selected assessment type. */
  function toggleExamFields() {
    if ($assessmentType.val() === 'exam') {
      $('.exam-fields').show();
    } else {
      $('.exam-fields').hide();
    }
  }
});
