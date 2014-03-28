// TODO: browserify
// This is an "abstract" view that should be extended with the following methods:
// goToLogicalPreviousPage, goToLogicalNextPage, preloadImages. Further, the
// view must trigger the event 'changeExamPage' every time the current page is
// changed. Other methods can be added as needed.
var ExamCanvasBaseView = IdempotentView.extend({
  // key codes for keyboard shorcuts
  LEFT_ARROW_KEY_CODE: 37,
  RIGHT_ARROW_KEY_CODE: 39,
  LOADING_ICON: '/static/img/loading_big.gif',

  events: {
    'click .previous-page': 'goToLogicalPreviousPage',
    'click .next-page': 'goToLogicalNextPage',
  },

  initialize: function(options) {
    IdempotentView.prototype.initialize.apply(this, arguments);

    this.preloadOtherStudentExams = options.preloadOtherStudentExams;
    this.preloadCurExam = options.preloadCurExam;
    this.millisecondsBeforeRetrying = 2000;
    this.createdImage = false;

    // events from other elements
    this.listenToDOM($(window), 'keydown', this.handleShortcuts);
  },

  render: function() {
    this.showPage();
    this.createZoomLens();
    this.preloadImages();
  },

  handleShortcuts: function(event) {
    // ignore keys entered in an input/textarea
    var $target = $(event.target);
    if ($target.is('input') || $target.is('textarea')) {
      return;
    }

    switch (event.keyCode) {
      case this.LEFT_ARROW_KEY_CODE:
        event.preventDefault();
        this.goToLogicalPreviousPage();
        break;

      case this.RIGHT_ARROW_KEY_CODE:
        event.preventDefault();
        this.goToLogicalNextPage();
        break;
    }
  },

  showPage: function() {
    // updates the exam canvas to show the image corresponding to the current
    // page number
    this.resized = false;

    // dynamically create the image tag if created before
    if (!this.createdImage) {
      this.createdImage = true;
      this.$examImg = $('<img class="exam-image" alt="Exam" />').appendTo(this.$el.find('.exam-canvas'));

      var self = this;
      // resize canvas after the image loads or canvas has not yet been resized
      this.$el.find('.exam-image').load(function() {
        if (this.src.indexOf(self.LOADING_ICON) === -1 || !self.resized) {
          self.resized = true;
          $(window).resize();
          var canvasHeight = self.$el.find('.exam-canvas').height();
          self.$el.find('.previous-page').height(canvasHeight);
          self.$el.find('.next-page').height(canvasHeight);
        }
      });

      // if loading the image failed, try to load it again after some time (wait 2
      // seconds, then 4, 8, 16, 32 which is max) while showing loading icon
      this.$el.find('.exam-image').error(function() {
        this.src = self.LOADING_ICON;
        window.setTimeout(function() {
          self.showPage();
        }, self.millisecondsBeforeRetrying);

        // cap exponential backoff time to 32
        if (self.millisecondsBeforeRetrying < 32) {
          self.millisecondsBeforeRetrying *= 2;
        }
      });
    }

    this.$el.find('.exam-image').attr('src', 'get-exam-jpeg/' + this.curPageNum + '/');
    this.preloadImages();
  },

  createZoomLens: function() {
    var zoomLensView = new ZoomLensView({
      curPageNum: this.curPageNum,
      el: '.exam-canvas'
    });
    this.registerSubview(zoomLensView);
    // zoom lens should know when the exam page changes, so that it will load
    // the correct page
    zoomLensView.listenTo(this, 'changeExamPage', zoomLensView.changeExamPage);
  },

  getCurPageNum: function() {
    return this.curPageNum;
  },

  preloadImages: function() {
    // handles preloading images for faster navigation through different jpegs
    //
    // currently does nothing; override this method
  },

  goToLogicalPreviousPage: function() {
    // handles the user clicking on the left arrow or using the keyboard
    // shortcut to navigate to the logical "previous" page
    //
    // currently does nothing; override this method
  },

  goToLogicalNextPage: function() {
    // handles the user clicking on the left arrow or using the keyboard
    // shortcut to navigate to the logical "next" page
    //
    // currently does nothing; override this method
  }
});