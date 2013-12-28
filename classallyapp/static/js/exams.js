$(function() {
  var popoverText = "To ensure nothing goes wrong during grading, once students have been mapped" +
    " to an exam, we no longer allow deletion of exams or editing exam rubrics. Please contact us" +
    " if this will be an issue.";
    var $popover = $('.info-popover');
    $popover.popover({content: popoverText});
});