var LandingPageView = IdempotentView.extend({
  HEADER_MARGIN_BOTTOM: 50,
  MARGIN_TOP_START: 160,
  MARGIN_BOTTOM_START: 160,
  HEADER_MINIMUM_HEIGHT: 650,
  ENTER_KEY_CODE: 13,

  events: {
    'click .sign-up': 'handleSignUp',
    'click .submit-email': 'submitEmail',
    'keypress .email input': 'detectSubmitEmail',
    'input .email input': 'hideErrorMessage',
    'click .interested': 'handleInterested'
  },

  initialize: function(options) {
    this.$signUpButton = this.$('.sign-up');
    this.$watchVideoButton = this.$('.watch-video');

    this.$headerContainer = this.$('.header-container');
    this.$header = this.$('header');
    this.$window = $(window);
    this.$logo = this.$('.logo');

    this.$emailContainer = this.$('.email');
    this.$emailInput = this.$('.email input');
    this.$emailSubmitSuccess = this.$('.email-submit-success');
    this.$emailInvalid = this.$('.email-invalid');
    this.$emailError = this.$('.email-error');

    this.curMarginTop = this.MARGIN_TOP_START;
    this.curMarginBottom = this.MARGIN_BOTTOM_START;

    // Don't perform any other initializations if user is viewing from mobile
    if (options.isMobile) {
      return;
    }

    // Resize the landing page header, and listen for window resize events
    this.resizeSplash();
    this.$window.resize(_.bind(this.resizeSplash, this));

    // Initialize the videos
    var fancyboxParams = {
      width: 1000,
      height: 730,
      type: 'iframe',
      allowfullscreen: true
    };
    $('.intro-video').fancybox(fancyboxParams);
    $('.demo-grading-video').fancybox(fancyboxParams);
  },

  resizeSplash: function() {
    var windowHeight = this.$window.height();
    var headerHeight = this.$header.height();
    // How much larger the window height should be
    var heightDifference = windowHeight - (headerHeight + this.HEADER_MARGIN_BOTTOM);
    if (heightDifference !== 0 && windowHeight > this.HEADER_MINIMUM_HEIGHT) {
      this.curMarginTop += heightDifference / 2.0;
      this.curMarginBottom += heightDifference / 2.0;
      this.$logo.css('margin-top', this.curMarginTop);
      this.$headerContainer.css('margin-bottom', this.curMarginBottom);
    }
  },

  handleSignUp: function() {
    // Reset the email
    this.$emailInput.val('');
    this.$emailSubmitSuccess.hide();

    this.$watchVideoButton.hide();
    this.$signUpButton.hide();
    this.$emailContainer.fadeIn();
    this.$emailInput.focus();
  },

  submitEmail: function(event) {
    var email = this.$emailInput.val();
    if (!this.isValidEmailAddress(email)) {
      this.$emailInvalid.show();
      return;
    }

    var self = this;
    $.ajax({
      type: 'POST',
      url: window.location.href + 'submit-email/',
      data: {
        'email_address': email,
        'csrfmiddlewaretoken': Utils.CSRF_TOKEN
      }
    }).done(function() {
      self.$emailContainer.hide();
      self.$watchVideoButton.show();
      self.$signUpButton.show();
      self.$emailSubmitSuccess.fadeIn();
    }).fail(function() {
      self.$emailError.fadeIn();
    });
  },

  detectSubmitEmail: function(event) {
    if (event.keyCode === this.ENTER_KEY_CODE) {
      this.submitEmail();
    }
  },

  isValidEmailAddress: function(email) {
    // Taken from http://stackoverflow.com/questions/8398403/jquery-javascript-to-check-if-correct-e-mail-was-entered
    var pattern = new RegExp(/^(("[\w-+\s]+")|([\w-+]+(?:\.[\w-+]+)*)|("[\w-+\s]+")([\w-+]+(?:\.[\w-+]+)*))(@((?:[\w-+]+\.)*\w[\w-+]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][\d]\.|1[\d]{2}\.|[\d]{1,2}\.))((25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\.){2}(25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\]?$)/i);
    return pattern.test(email);
  },

  hideErrorMessage: function() {
    this.$emailInvalid.hide();
  },

  handleInterested: function(event) {
    event.preventDefault();

    var self = this;
    $('html, body').animate({ scrollTop: 0 }, 'slow', function() {
      self.$signUpButton.click();
    });
  }
});


$(function() {
  var landingPageView = new LandingPageView({
    el: $('.landing-page'),
    isMobile: $('meta[name="viewport"]').length > 0
  });
});
