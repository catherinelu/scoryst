$(function() {
  $('.finalized-info-popover').popover();

  var pdfInfoPopoverText = 'Not sure how to create a PDF? ' +
    'Just follow the instructions given below.';

  var $pdfInfoPopover = $('.pdf-info-popover');
  $pdfInfoPopover.popover({ content: pdfInfoPopoverText });

  // When the popover is being displayed, highlight the part that gives
  // instructions on how to create PDFs
  $($pdfInfoPopover).on('shown.bs.popover', function () {
    $('.create-pdf-info').addClass('highlighted');
  });

  $($pdfInfoPopover).on('hidden.bs.popover', function () {
    $('.create-pdf-info').removeClass('highlighted');
  });
});
