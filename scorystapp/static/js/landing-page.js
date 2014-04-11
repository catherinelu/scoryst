$(function () {
  ENTER_KEY_CODE = 13;

  var $emailInput = $('.publicly-launch-email');
  var $splash = $('.splash');
  var $contactForm = $('.contact-form');
  var $body = $('body');

  $('#demo-video').fancybox({
    width: 680,
    height: 495,
    type: 'iframe',
    allowfullscreen: true
  });

  function load() {
    $splash.fadeIn({queue: false, duration: 1000});
    $splash.animate({left: '-=200', top: '-=200'}, 1000);
  };

  load();

  // Resize the splash page if it does not take up the entire window.
  var resizeSplash = function() {
    console.log('resize');
    var windowHeight = $(window).height();
    var bodyHeight = $body.outerHeight() + $body.offset().top;
    if (windowHeight !== bodyHeight && windowHeight > 650) {
      var $panel = $('.col-xs-4');
      var paddingTop = parseInt($panel.css('margin-top'), 10);
      var paddingBottom = parseInt($panel.css('margin-bottom'), 10);
      var additionalPadding = (windowHeight - bodyHeight) / 4.0;
      $panel.css('margin-top', paddingTop + additionalPadding + 'px');
      $panel.css('margin-bottom', paddingBottom + (additionalPadding * 3) + 'px');
    }
  }

  resizeSplash();
  $(window).resize(resizeSplash);

  var yay = function() {
    $contactForm.fadeIn({queue: false, duration: 300});
    $contactForm.animate({top: '-=200'}, 300);
    $emailInput.focus();
    resizeSplash();
  };

  $emailInput.focus(function() {
    if ($contactForm.css('display') === 'none') {
      $splash.fadeOut({queue: false, duration: 300, complete: yay});
      $splash.animate({top: '+=200'}, 300);
      console.log('focus');
    }
  });

  $('.publicly-launch-email').blur(function() {
    console.log('blur');
  });

  // If the email is submitted (by click or enter), process.
  var processEmail = function() {
    $.ajax({
      url: 'waitlist/',
      data: { email: $emailInput.val() },
    }).done(function() {
      $('.error').hide();
      $('.success').fadeIn();
    }).fail(function(request, error) {
      $('.success').hide();
      $('.error').fadeIn();
    });    
  }

  $('.submit').click(processEmail);
  $('.form-group input').keyup(function (e) {
    if (e.keyCode == ENTER_KEY_CODE) {
        processEmail();
    }
  });

});
