var ExamCanvasGradeView = ExamCanvasView.extend({
  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);

    this.$examImage = this.$examCanvas.find('.exam-image');
    this.$previousPage = this.$el.find('.previous-page');
    this.$nextPage = this.$el.find('.next-page');
    this.$previousAnnotationInfoButton = this.$el.find('button.previous');
    this.$nextAnnotationInfoButton = this.$el.find('button.next');
    this.questionPartAnswer = options.questionPartAnswer;

    var self = this;
    this.fetchPages(function(pages) {
      self.pages = pages;
      self.getPageIndexFromQuestionPartAnswer(self.questionPartAnswer);
      self.render();
      self.delegateEvents();
    });

    // custom events for going through info about annotations
    var self = this;
    this.listenToDOM(this.$el.find('.annotation-info-modal'), 'show.bs.modal', function() {
      var $allAnnotationInfo = self.$el.find('.annotation-info li');
      $allAnnotationInfo.hide();
      self.$currAnnotationInfo = $allAnnotationInfo.eq(0);
      self.$currAnnotationInfo.show();
      self.$nextAnnotationInfoButton.show();
      self.$previousAnnotationInfoButton.hide();
    });
    this.listenToDOM(this.$previousAnnotationInfoButton, 'click', this.goToPreviousAnnotationInfo);
    this.listenToDOM(this.$nextAnnotationInfoButton, 'click', this.goToNextAnnotationInfo);

    // mediator events
    this.listenTo(Mediator, 'changeQuestionPartAnswer',
      function(questionPartAnswer) {
        this.getPageIndexFromQuestionPartAnswer(questionPartAnswer);
        this.showPage();
        this.trigger('changeExamPage', this.pages[this.pageIndex]);          
        this.updateExamArrows();
      }
    );
  },

  goToNextAnnotationInfo: function() {
    this.$currAnnotationInfo.hide();
    this.$currAnnotationInfo = this.$currAnnotationInfo.next();
    this.$currAnnotationInfo.show();
    if (this.$currAnnotationInfo.next().length === 0) {
      this.$nextAnnotationInfoButton.hide();
    }
    this.$previousAnnotationInfoButton.show();
  },

  goToPreviousAnnotationInfo: function() {
    this.$currAnnotationInfo.hide();
    this.$currAnnotationInfo = this.$currAnnotationInfo.prev();
    this.$currAnnotationInfo.show();
    if (this.$currAnnotationInfo.prev().length === 0) {
      this.$previousAnnotationInfoButton.hide();
    }
    this.$nextAnnotationInfoButton.show();
  },

  // handles preloading images for faster navigation through different jpegs
  preloadImages: function() {
    if (this.preloadCurExam) {
      for (var i = -this.preloadCurExam; i <= this.preloadCurExam; i++) {
        // preload pages before and after, corresponding to the current student
        if (this.pageIndex + i < this.pages.length - 1 && this.pageIndex + i > 0) {
          var pageToPreload = this.pages[this.pageIndex + i];
          var image = new Image();
          image.src = 'get-exam-jpeg/' + pageToPreload + '/';
        }
      }
    }

    if (this.preloadOtherStudentExams) {
      for (var i = -this.preloadOtherStudentExams; i <= this.preloadOtherStudentExams; i++) {
        // preload page of previous and next students
        var image = new Image();
        var questionPart = this.questionPartAnswer.get('questionPart');
        image.src = 'get-student-jpeg/' + i + '/' + questionPart.questionNumber +
          '/' + questionPart.partNumber + '/';
      }
    }
  },

  // handles the user clicking on the left arrow or using the keyboard
  // shortcut to navigate to the previous page
  goToPreviousPage: function() {
    if (this.pageIndex > 0) {
      this.pageIndex -= 1;
      this.trigger('changeExamPage', this.pages[this.pageIndex]);
      this.updateExamArrows();
      this.showPage();
    }
  },

  // handles the user clicking on the left arrow or using the keyboard
  // shortcut to navigate to the next page
  goToNextPage: function() {
    if (this.pageIndex < this.pages.length - 1) {
      this.pageIndex += 1;
      this.trigger('changeExamPage', this.pages[this.pageIndex]);
      this.updateExamArrows();
      this.showPage();
    }
  },

  fetchPages: function(callback) {
    $.ajax({
      url: 'get-non-blank-pages/'
    }).done(function(pages) {
      callback(pages);
    });
  },

  showPage: function() {
    // updates the exam canvas to show the image corresponding to the current
    // page number
    this.$examImage.attr('src', 'get-exam-jpeg/' + this.pages[this.pageIndex] + '/');
    this.preloadImages();
  },

  getPageIndexFromQuestionPartAnswer: function(questionPartAnswer) {
    var firstPageStr = questionPartAnswer.get('pages').split(',')[0];
    var firstPage = parseInt(firstPageStr, 10);
    if (this.pages[this.pageIndex] !== firstPage) {
      this.pageIndex = this.pages.indexOf(firstPage);
      if (this.pageIndex === -1) {
        this.pageIndex = 0;
      }
    }
  },

  updateExamArrows: function() {
    // first disable both arrows
    this.$nextPage.removeClass('disabled');
    this.$previousPage.removeClass('disabled');

    // next, check if any need to be disabled. note that it  isn't possible for
    // arrows to "flicker" since this function is called only when the current page
    // number has changed. thus, if either arrow should now be disabled, they
    // would not have been disabled previously.
    if (this.pageIndex === 0) {
      this.$previousPage.addClass('disabled');
    } else if (this.pageIndex === this.pages.length - 1) {
      this.$nextPage.addClass('disabled');
    }
  }
});
