$(function() {
  var infoPopoverText = 'To ensure nothing goes wrong during grading, once students have been mapped' +
    ' to an exam, exams can no longer be edited or deleted.';

  var $infoPopover = $('.info-popover');
  $infoPopover.popover({ content: infoPopoverText });

  var $confirmDeletionTemplate = $('.confirm-deletion-template');
  // Create the popover to warn deletion of an exam
  new PopoverConfirm($confirmDeletionTemplate, 'delete', 'cancel-deletion');
});
