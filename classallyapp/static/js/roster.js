$(function() {
  var $confirmDeletionTemplate = $('.confirm-deletion-template');
  // Create the popover to warn deletion from roster
  new PopoverConfirm($confirmDeletionTemplate, 'delete', 'cancel-deletion');

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
    var offset = $('.course-roster h2').offset().top + $('.course-roster h2').height();
    var maxHeight = $('.main').height() - offset - $('footer').height();
    $('.roster-scroll table').css({'max-height': maxHeight + 'px'})
  }
  resizeRosterList();
  $('.main').resize(resizeRosterList);
});
