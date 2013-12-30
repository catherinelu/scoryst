$(function() {
  var $confirmDeletionTemplate = $('.confirm-deletion-template');
  // Create the popover to warn deletion from roster
  new PopoverConfirm($confirmDeletionTemplate, 'delete', 'cancel-deletion');
  var $main = $('.main');
  var $rosterScroll = $('.roster-scroll');

  // Enable sorting
  $('table').tablesorter({
    headers: {  
      // assign the fourth column (we start counting zero)
      3: { 
        // disable it by setting the property sorter to false
        sorter: false 
      }
    },
    // Sort based on privilege first
    sortList: [[2,0]]
  });

  function resizeRosterList() {
    var maxHeight = $main.height() - $rosterScroll.offset().top -
      parseInt($('.container.roster').css('margin-bottom'), 10);
    $rosterScroll.css({'max-height': maxHeight + 'px'})
  }
  resizeRosterList();
});
