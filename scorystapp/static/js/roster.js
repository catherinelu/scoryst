$(function() {
  var $confirmDeletionTemplate = $('.confirm-deletion-template');
  
  var $delete = $('.delete');
  // Create the popover to warn deletion from roster
  $delete.popoverConfirm({ 
    '$handlebarsTemplate': $confirmDeletionTemplate, 
    '$cancelSelector': $('.cancel-deletion')
  });

  var $main = $('.main');
  var $rosterScroll = $('.roster-scroll');
  var $table = $('table');

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

  // Handles when a user clicks on the edit icon.
  $table.on('click', 'a.edit', function(event) {
    var $target = $(event.target);
    var $tr = $target.parents('tr');
    var $tds = $tr.children('td');

    // Go through td elements representing the student's name and their SUNET ID.
    for (var i = 0; i < $tds.length - 2; i++) {
      $tds.eq(i).html('<input value="' + $tds.eq(i).html() + '">');
    }

    // Replace the Privilege field with a selection.
    var privilegeIndex = $tds.length - 2;
    var $selectHTML = $('<select><option>Instructor</option><option>TA</option>' +
      '<option>Student</option></select>');
    // Make the selected one show up as the already saved one.
    for (var i = 0; i < $selectHTML.find('option').length; i++) {
      if ($selectHTML.find('option').eq(i).val() === $tds.eq(privilegeIndex).html()) {
        $selectHTML.find('option').eq(i).attr('selected', 'selected');
      }
    }
    $tds.eq(privilegeIndex).html('<select>' + $selectHTML.html() + '</select>');

    // Change the edit icon to a save icon.
    $target.removeClass('fa-pencil');
    $target.addClass('fa-save');
    $target.parents('a').removeClass('edit');
    $target.parents('a').addClass('save');
  });

  function getCsrfToken() {
    var cookieIsRaw = $.cookie.raw;
    // Set the cookie settings to raw, in order to get the csrf token.
    $.cookie.raw = true;
    // Get the csrf token.
    var csrfToken = $.cookie('csrftoken');
    // Reset the cookie raw settings.
    $.cookie.raw = cookieIsRaw;
    return csrfToken;
  }

  // Handles when a user clicks on the save icon.
  $table.on('click', 'a.save', function(event) {
    var $target = $(event.target);
    var $tr = $target.parents('tr');
    var $tds = $tr.children('td');
    var privilege = $tds.find('select option').filter(':selected').val();

    $.ajax({
      type: 'POST',
      url: 'edit/',
      data: {
        'course_user_id':  $tr.attr('data-user-id'),
        'first_name': $tds.eq(0).find('input').val(),
        'last_name': $tds.eq(1).find('input').val(),
        'student_id': $tds.eq(2).find('input').val(),
        'privilege': privilege,
        'csrfmiddlewaretoken': getCsrfToken()
      }
    }).done(function() {
      // Replace input boxes with text.
      for (var i = 0; i < $tds.length - 2; i++) {
        $tds.eq(i).html($tds.eq(i).find('input').val());
      }
      // Replace the privilege selection.
      $tds.eq($tds.length - 2).html(privilege);

      // Change the icon.
      $target.removeClass('fa-save');
      $target.addClass('fa-pencil');
      $target.parents('a').removeClass('save');
      $target.parents('a').addClass('edit');
    }).fail(function(request, error) {
      console.log('Failed to save updates to roster: ' + error);
    });
  });

});