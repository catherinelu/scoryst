$(function() {
  var $confirmDeletionTemplate = $('.confirm-deletion-template');
  var renderConfirmDeletion = Handlebars.compile($confirmDeletionTemplate.html());

  var $window = $(window);
  var $deleteButtons = $('.delete');

  $deleteButtons.each(function() {
    var $delete = $(this);
    var content = renderConfirmDeletion({ deleteLink: $delete.attr('href') });

    $delete.popover({
      html: true,
      content: content,
      trigger: 'manual',
      title: 'Are you sure?'
    });
  });

  // show popover when user clicks on delete button
  $deleteButtons.click(function(event) {
    event.preventDefault();
    $deleteButtons.popover('hide');

    var $delete = $(this);
    $delete.popover('show');
  });

  // hide popover if user clicks outside of it and outside of delete buttons
  $window.click(function(event) {
    var $target = $(event.target);
    var $parents = $target.parents().andSelf();

    if ($parents.filter('.delete').length === 0 &&
        $parents.filter('.popover').length === 0) {
      $deleteButtons.popover('hide');
    }
  });

  $window.click(function(event) {
    var $target = $(event.target);

    if ($target.is('.cancel-deletion')) {
      event.preventDefault();
      // cancel deletion by closing popovers
      $deleteButtons.popover('hide');
    }
  });
});
