// TODO (kvmohan): make this a jQuery plugin; see
// http://learn.jquery.com/plugins/basic-plugin-creation/
// TODO (kvmohan): pass in an object containing parameters rather than so many arguments 
//
// Takes care of creating popovers which have a cancel option associated with it.
// 
// Parameters:
// $handlebarsTemplate: template to be compiled as content for the popover.
// triggerClass: class of the DOM elements that will trigger the popover on click.
// cancelClass: class of the popover element to cancel the popover action.
// $link (optional): by default, we use the trigegrClass' href as our link when
// confirm is clicked. This behavior can be overridden by using $link.
function PopoverConfirm($handlebarsTemplate, triggerClass, cancelClass, $link, placement) {
  this.$link = $link;
  this.renderConfirm = Handlebars.compile($handlebarsTemplate.html());
  // TODO (kvmohan): rename triggerClass to triggerSelector and have the user provide
  // a full selector (provides more flexibility)
  this.$triggerButtons = $('.' + triggerClass);

  var $window = $(window);
  // TODO (kvmohan): call this self (that makes it consistent with python code)
  var obj = this;

  // For each of the trigger buttons, initialize the popover
  this.$triggerButtons.each(function() {
    var $trigger = $(this);
    // If the user has specified a link use it, otherwise use the href attribute of the
    // trigger button
    var content = obj.renderConfirm({ link: obj.$link || $trigger.attr('href') });

    $trigger.popover({
      html: true,
      content: content,
      trigger: 'manual',
      title: 'Are you sure?',
      placement: placement ? placement : 'right'
      // Unfortunately, the next hacky line is the only way I could find to add
      // a class to a popover
      // TODO (kvmohan): this is fine; just modify your comment slightly;
      // something like "add class to popover (hacky solution, but it works)"
    }).data('bs.popover').tip().addClass('confirm-popover');
  });

  // show popover when user clicks on $trigger button
  this.$triggerButtons.click(function(event) {
    event.preventDefault();
    obj.$triggerButtons.popover('hide');

    var $trigger = $(this);
    $trigger.popover('show');
  });

  // hide popover if user clicks outside of it and outside of trigger buttons
  $window.click(function(event) {
    var $target = $(event.target);
    var $parents = $target.parents().andSelf();

    if ($parents.filter('.' + triggerClass).length === 0 &&
        $parents.filter('.popover').length === 0) {
      obj.$triggerButtons.popover('hide');
    }
  });

  // If user clicks on the cancel button in the popover, hide it.
  $window.click(function(event) {
    var $target = $(event.target);
    // TODO (kvmohan): cancel class should also be a selector
    if ($target.is('.' + cancelClass)) {
      event.preventDefault();
      // cancel by closing popovers
      obj.$triggerButtons.popover('hide');
    }
  });
}

// TODO (kvmohan): the comment below is confusing. I think you mean "updates
// the link of the confirm button of the popover"; saying "updates the link
// *when* the confirm button is clicked" suggests that the update only happens
// on click
//
// Updates the link when the confirm button of the popover is clicked
PopoverConfirm.prototype.updateLink = function(link) {
  this.$link = link;
  var content = this.renderConfirm({ link: this.$link || $trigger.attr('href') });
  this.$triggerButtons.attr('data-content', content);
};
