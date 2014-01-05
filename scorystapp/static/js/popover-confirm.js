// jQuery plugin that takes care of creating popovers which have a cancel 
// option associated with them.
// 
// Usage:
// $('.button-class').popoverConfirm(options) where options is an object of the form:
// {
//  '$handlebarsTemplate': handlebars template whose content will be shown when the
//                         button is clicked, 
//  '$cancelSelector': jQuery object representing the cancel button,
//  'link': link when the user confirms the click (default: href attr of the DOM element
//          to which the plugin is attached)
//  'placement': 'left', 'right', 'top' or 'bottom' (default: right)
// }
// 
(function ($) {
  var self;
  var $window = $(window);

  $.fn.popoverConfirm = function(options) {
    // Store original jQuery object
    self = this; 

    var settings = $.extend({
      'placement': 'right'
    }, options);

    self.renderConfirm = Handlebars.compile(settings.$handlebarsTemplate.html());
    
    // Always return to allow chaining
    returnObject = self.each(function(i, elem) {
      var $trigger = $(this);
      // If the user has specified a link use it, otherwise use the href attribute of the
      // trigger button
      var content = self.renderConfirm({ link: settings.link || $trigger.attr('href') });

      $trigger.popover({
        html: true,
        content: content,
        trigger: 'manual',
        title: 'Are you sure?',
        placement: settings.placement
        // Add a class to popover (hacky solution, but it works)
      }).data('bs.popover').tip().addClass('confirm-popover');
    });

    // show popover when user clicks on the DOM element the plugin is attached to
    self.click(function(event) {
      event.preventDefault();
      self.popover('hide');

      var $trigger = $(this);
      $trigger.popover('show');
    });

    // hide popover if user clicks outside of it and outside of trigger buttons
    $window.click(function(event) {
      var $target = $(event.target);
      var $parents = $target.parents().andSelf();

      if ($parents.filter(self.selector).length === 0 &&
          $parents.filter('.popover').length === 0) {
        self.popover('hide');
      }
    });

    // If user clicks on the cancel button in the popover, hide it.
    $window.click(function(event) {
      var $target = $(event.target);
      if ($target.is(settings.$cancelSelector.selector)) {
        event.preventDefault();
        self.popover('hide');
      }
    });

    return returnObject;
  };

})(jQuery);
