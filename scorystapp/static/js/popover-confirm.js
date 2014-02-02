// jQuery plugin that creates popovers with cancel and confirm buttons.
// 
// Usage:
// $('.button-class').popoverConfirm(options) where options is an object of the form:
//
// {
//   title: (string) title of popover,
//   text: (string) text inside popover,
//   placement: (string) where popover should be placed (left, right, top, or bottom),
//   popoverClass: (string) class to add to popover div,
//
//   cancelText: (string) text on the cancel button,
//   cancelClass: (string) class to add to the cancel button,
//   confirmText: (string) text on the confirm button,
//   confirmClass: (string) class to add to confirm button,
//
//   cancel: (function) handler when cancel button is clicked,
//   confirm: (function) handler when confirm button is clicked
// }
//
// Default options are:
// {
//   title: 'Are you sure?',
//   text: '',
//   placement: 'right',
//   popoverClass: 'confirm-popover',
//
//   cancelText: 'Cancel',
//   cancelClass: 'cancel',
//   confirmText: 'Delete',
//   confirmClass: 'delete',
//
//   cancel: function() {},
//   confirm: function(event) {
//     // navigate normally
//     var href = $(event.currentTarget).attr('href');
//     if (href) {
//       window.location.href = href;
//     }
//   }
// }
// 
(function ($) {
  var $window = $(window);
  
  $.fn.popoverConfirm = function(options) {
    // Store original jQuery object
    var self = this; 

    var settings = $.extend({
      title: 'Are you sure?',
      text: '',
      placement: 'right',
      popoverClass: 'confirm-popover',

      cancelText: 'Cancel',
      cancelClass: 'cancel',
      confirmText: 'Delete',
      confirmClass: 'delete',

      cancel: function() {},
      confirm: function(event) {
        // navigate normally
        var href = $(event.currentTarget).attr('href');
        if (href) {
          window.location.href = href;
        }
      }
    }, options);

    var $confirm = $('<a />', {
      href: '#',
      'class': 'btn btn-danger btn-sm ' + settings.confirmClass
    }).text(settings.confirmText);

    var $cancel = $('<a />', {
      href: '#',
      'class': 'btn btn-default btn-sm ' + settings.cancelClass
    }).text(settings.cancelText);
    
    // Always return to allow chaining
    self.each(function(i, elem) {
      var $trigger = $(this);

      $confirm.attr('href', $trigger.attr('href'));
      var popoverHTML = $confirm.prop('outerHTML') + $cancel.prop('outerHTML');

      // add text to popover if it was given
      if (settings.text) {
        var $p = $('<p />').text(settings.text);
        popoverHTML = $p.prop('outerHTML') + popoverHTML;
      }

      $trigger.popover({
        html: true,
        content: popoverHTML,
        trigger: 'manual',
        title: settings.title,
        placement: settings.placement
        // Add a class to popover (hacky solution, but it works)
      }).data('bs.popover').tip().addClass(settings.popoverClass);

      var $popover = $trigger.data('bs.popover').tip();
      $popover.addClass(settings.popoverClass);

      // close popover when cancel is clicked
      $popover.on('click', '.' + settings.cancelClass, function(event) {
        event.preventDefault();
        settings.cancel(event);
        self.popover('hide');
      });

      // call handler when confirm is clicked
      $popover.on('click', '.' + settings.confirmClass, function(event) {
        event.preventDefault();
        settings.confirm(event);
        self.popover('hide');
      });
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

    return self;
  };

})(jQuery);
