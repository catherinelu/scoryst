$(function () {
  ENTER_KEY_CODE = 13;

  $('#demo-video').fancybox({
    width: 680,
    height: 495,
    type: 'iframe',
    allowfullscreen: true
  });

  $('.learn-more a').click(function(event) {
    event.preventDefault();
    $('body').animate({
      scrollTop: $('.steps').offset().top
    }, 1000);
  });

  // Resize the splash page if it does not take up the entire window.
  var resizeSplash = function() {
    var windowHeight = $(window).height();
    var $splash = $('.splash');
    var splashHeight = $splash.outerHeight() + $splash.offset().top;
    if (windowHeight > splashHeight) {
      var paddingTop = parseInt($splash.css('padding-top'), 10);
      var paddingBottom = parseInt($splash.css('padding-bottom'), 10);
      var additionalPadding = (windowHeight - splashHeight) / 2.0;
      $splash.css('padding-top', paddingTop + additionalPadding + 'px');
      $splash.css('padding-bottom', paddingBottom + additionalPadding + 'px');
    }
  }

  resizeSplash();
  $(window).resize(resizeSplash);


  // If the email is submitted (by click or enter), process.
  var processEmail = function() {
    var $emailInput = $('.publicly-launch-email');

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
