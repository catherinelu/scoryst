$(function() {
  var $container = $('.container');
  var $nav = $('nav');
  var origNavHeight = $nav.height();

  /* This function calculates and sets the height of the navigation bar. */
  window.resizeNav = function() {
      // the height of the page excluding the header and footer
      var contentHeight = $container.outerHeight(true);

      // the height of the browser
      var viewportHeight = $(window).height() - $('header').height() - $('footer').height();

      // ensure the nav takes up the entire content/viewport space
      var navHeight = Math.max(viewportHeight, contentHeight, origNavHeight);
      $nav.height(navHeight);
  };

  resizeNav();
  $(window).resize(resizeNav);

  // show dropdown menu on hover
  $('.dropdown').hover(function() {
    $(this).children('.dropdown-menu').show();
  }, function() {
    $(this).children('.dropdown-menu').hide();
  });

  // allows us to store objects in cookies
  $.cookie.json = true;

  var invisibleCourses = $.cookie('invisibleCourses');
  if (typeof invisibleCourses !== 'object') {
    // default to all visible courses
    invisibleCourses = {};
  }

  $('.course').click(function() {
    var $course = $(this);
    var courseId = $course.data('id');
    var showedCourse = toggleCourse($course);

    // update cookie that tracks invisible courses
    if (showedCourse) {
      delete invisibleCourses[courseId];
    } else {
      invisibleCourses[courseId] = true;
    }

    $.cookie('invisibleCourses', invisibleCourses, { path: '/' });
  });

  // show/hide courses based off past user preferences
  $('.course').each(function() {
    var $course = $(this);
    var courseId = $course.data('id');

    // all courses are visible by default; hide those the user doesn't want shown
    if (invisibleCourses[courseId]) {
      toggleCourse($course);
    }
  });

  /* Toggles the visibility of the given course. Returns true if it showed the
   * course or false if it hid it. */
  function toggleCourse($course) {
    var $nextLi = $course.next();
    var shouldShow = $nextLi.is(':hidden');

    // show/hide course links when course is clicked
    while ($nextLi.length !== 0 && !$nextLi.hasClass('course')) {
      if (shouldShow) {
        $nextLi.show();
      } else {
        $nextLi.hide();
      }

      $nextLi = $nextLi.next();
    }

    // update styles
    if (shouldShow) {
      $course.removeClass('contracted');
    } else {
      $course.addClass('contracted');
    }

    return shouldShow;
  }

  // reload collapsed nav setting
  var $main = $('.main');
  if ($.cookie('navCollapsed')) {
    $main.addClass('collapsed-nav');
  }

  // allow user to collapse nav
  $('.collapse-nav').click(function(event) {
    event.preventDefault();
    $main.toggleClass('collapsed-nav');

    // save setting
    $.cookie('navCollapsed', $main.hasClass('collapsed-nav'), { path: '/' });
  });

  // http://stackoverflow.com/questions/22071550/force-backbone-or-underscore-to-always-escape-all-variables
  if (typeof _ !== 'undefined') {
    _.templateSettings =
    {
      escape: /<%=([\s\S]+?)%>/g,
      interpolate: /<%-([\s\S]+?)%>/g,
      evaluate: /<%([\s\S]+?)%>/g
    };
  }
});
