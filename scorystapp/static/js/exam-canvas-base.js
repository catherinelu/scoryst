// TODO: browserify
// This is a basic exam canvas view that could be extended. Currently, the exam
// canvas handles (TODO: add)
//
// If you wish to extend this view:
// 1. The view must trigger the event 'changeExamPage' every time the current
// page is changed. Other methods can be added as needed.
// 2. It is up to the view that extends this to add/remove the class "disabled"
// to the .previous-page and .next-page panels when it is impossible go to to
// the previous or next pages.
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

    this.$examCanvas = this.$el.find('.exam-canvas');
    this.$previousPage = this.$el.find('.previous-page');
    this.$nextPage = this.$el.find('.next-page');
    this.$examImage = this.$examCanvas.find('.exam-image');
    if (this.$examImage.length === 0) {
      this.$examImage = $('<img class="exam-image" alt="Exam" />').appendTo(this.$examCanvas);
    }

    this.preloadOtherStudentExams = options.preloadOtherStudentExams;
    this.preloadCurExam = options.preloadCurExam;
    this.millisecondsBeforeRetrying = 2000;
    this.curPageNum = 1;

    // get the number of pages the exam has
    var self = this;
    this.setTotalNumPages(function(totalNumPages) {
      self.totalNumPages = totalNumPages;
      self.delegateEvents();
      self.render();
    });

    // resize canvas after the image loads or canvas has not yet been resized
    this.$examImage.load(function() {
      if (this.src.indexOf(self.LOADING_ICON) === -1 ||
          self.$examCanvas.height() !== self.$previousPage.height()) {
        $(window).resize();
        var canvasHeight = self.$examCanvas.height();
        self.$previousPage.height(canvasHeight);
        self.$nextPage.height(canvasHeight);
      }
    });

    // if loading the image failed, try to load it again after some time (wait 2
    // seconds, then 4, 8, 16, 32 which is max) while showing loading icon
    this.$examImage.error(function() {
      this.src = self.LOADING_ICON;
      window.setTimeout(function() {
        self.showPage();
      }, self.millisecondsBeforeRetrying);

      // cap exponential backoff time to 32
      if (self.millisecondsBeforeRetrying < 32) {
        self.millisecondsBeforeRetrying *= 2;        
      }
    });

    // events from other elements
    this.listenToDOM($(window), 'keydown', this.handleShortcuts);
  },

  render: function() {
    this.showPage();
    this.updateExamArrows();
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
    this.$examImage.attr('src', 'get-exam-jpeg/' + this.curPageNum + '/');
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

  // handles the user clicking on the left arrow or using the keyboard
  // shortcut to navigate to the logical "previous" page
  goToLogicalPreviousPage: function() {
    if (this.curPageNum > 1) {
      this.curPageNum -= 1;
      this.trigger('changeExamPage', this.curPageNum);
      this.updateExamArrows();
      this.showPage();
    }
  },

  // handles the user clicking on the left arrow or using the keyboard
  // shortcut to navigate to the logical "next" page
  goToLogicalNextPage: function() {
    if (this.curPageNum < this.totalNumPages) {
      this.curPageNum += 1;
      this.trigger('changeExamPage', this.curPageNum);
      this.updateExamArrows();
      this.showPage();
    }
  },

  // callback takes the number of total pages in the exam
  setTotalNumPages: function(callback) {
    var self = this;
    $.ajax({
      url: 'get-exam-page-count/',
      dataType: 'text'
    }).done(function(data) {
      callback(parseInt(data, 10));
    });
  },

  getTotalNumPages: function() {
    return self.totalNumPages;
  },

  // handles preloading images for faster navigation through different jpegs
  preloadImages: function() {
    if (this.preloadCurExam) {
      for (var i = -this.preloadCurExam; i <= this.preloadCurExam; i++) {
        // preload pages before and after, corresponding to the current student
        var pageToPreload = this.curPageNum + i;
        if (pageToPreload >= 1 && pageToPreload <= this.totalNumPages) {
          var image = new Image();
          image.src = 'get-exam-jpeg/' + pageToPreload + '/';
        }
      }
    }

    if (this.preloadOtherStudentExams) {
      for (var i = -this.preloadOtherStudentExams; i <= this.preloadOtherStudentExams; i++) {
        var image = new Image();
        image.src = 'get-student-jpeg/' + i + '/' + this.curPageNum + '/';
      }
    }
  },

  updateExamArrows: function(oldCurPageNum) {
    this.$nextPage.removeClass('disabled');
    this.$previousPage.removeClass('disabled');
    if (this.curPageNum === 1) {
      this.$previousPage.addClass('disabled');
    } else if (this.curPageNum === this.totalNumPages) {
      this.$nextPage.addClass('disabled');
    }
  }
});
