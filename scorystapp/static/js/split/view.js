// TODO: browserify
var SplitView = Backbone.View.extend({
  NUM_COLS: 8,
  NUM_ROWS: 4,

  templates: {
    imagesTemplate: _.template(this.$('.images-template').html()),
    pageIndexTemplate: _.template(this.$('.page-index-template').html())
  },

  events: {
    'click .next-images': 'viewNextImages',
    'click .previous-images': 'viewPreviousImages',
    'click .image-container': 'markImage',
    'click .zoom': 'showModal'
  },

  initialize: function(options) {
    this.$imageGrid = this.$('.image-grid');
    this.$modal = $('.modal');  // used to show large jpegs
    this.$pageIndexContainer = this.$('.page-index');
    this.$nextButton = this.$('.next-images');
    this.$backButton = this.$('.previous-images');
    this.$numExamsSelected = this.$('.num-exams-selected');

    this.imageContainerFirstPageNums =  [];

    var self = this;
    this.pages = new SplitPageCollection();
    this.pages.fetch({
      success: function() {
        self.firstPageIndex = 0;
        // This refers to what "page" the user is viewing. The user can change the
        // "page" by clicking the next or back buttons.
        self.curPage = 1;
        self.totalNumPages = Math.ceil(self.pages.length / (self.NUM_ROWS * self.NUM_COLS));

        // Determine how many selected first pages there are
        self.numSelectedPages = self.pages.filter(function(page) {
          return page.get('beginsSubmission');
        }).length;
        self.$numExamsSelected.html(self.numSelectedPages);

        self.render();
      }
    });
  },

  render: function() {
    var pages = this.pages.toJSON().slice(this.firstPageIndex,
      this.firstPageIndex + this.NUM_ROWS * this.NUM_COLS);
    this.$imageGrid.html(this.templates.imagesTemplate({
      'pages': pages,
      'numCols': this.NUM_COLS,
      'numRows': this.NUM_ROWS
    }));

    this.$pageIndexContainer.html(this.templates.pageIndexTemplate({
      'curPage': this.curPage,
      'totalNumPages': this.totalNumPages
    }))

    // Show/hide the back and next buttons. Use visibility as opposed to display
    // so that the text/buttons don't move.
    if (this.curPage === 1) {
      this.$backButton.css('visibility', 'hidden');
    } else {
      this.$backButton.css('visibility', 'visible');
    }

    if (this.curPage === this.totalNumPages) {
      this.$nextButton.css('visibility', 'hidden');
    } else {
      this.$nextButton.css('visibility', 'visible');
    }

    this.addExamPageNumbers();
  },

  viewNextImages: function() {
    var nextFirstPageIndex = this.firstPageIndex + this.NUM_ROWS * this.NUM_COLS;
    if (nextFirstPageIndex < this.pages.length) {
      this.firstPageIndex = nextFirstPageIndex;
      this.curPage += 1
      this.render();
    }
  },

  viewPreviousImages: function() {
    var nextFirstPageIndex = this.firstPageIndex - this.NUM_ROWS * this.NUM_COLS;
    if (nextFirstPageIndex > 0) {
      this.firstPageIndex = nextFirstPageIndex;
      this.curPage -= 1;
    } else {
      this.firstPageIndex = 0;
      this.curPage = 1;
    }
    this.render();
  },

  markImage: function(event) {
    var $currentTarget = $(event.currentTarget);
    var imageId = parseInt($currentTarget.attr('data-page-id'), 10);
    var pageToSave = this.pages.filter(function(page) {
      return page.id === imageId;
    })[0];

    // If the page has been marked, set `beginsSubmission` to true, else false
    if ($currentTarget.hasClass('selected')) {
      $currentTarget.removeClass('selected');
      pageToSave.save({ 'beginsSubmission': false });

      this.numSelectedPages -= 1;

      // Check if the page deselected is the first page, in which case
    } else {
      $currentTarget.addClass('selected');
      pageToSave.save({ 'beginsSubmission': true });

      this.numSelectedPages += 1;
    }

    // Update the number of selected exams
    this.$numExamsSelected.html(this.numSelectedPages);
    this.addExamPageNumbers();
  },

  showModal: function(event) {
    var $currentTarget = $(event.currentTarget);
    var imageId = $currentTarget.parents('.image-container').attr('data-page-id');
    imageId = parseInt(imageId, 10);
    var pageToShow = this.pages.filter(function(page) {
      return page.id === imageId;
    })[0];

    var newImage = $('<img>').attr({'src': pageToShow.get('pageJpegUrl'), 'alt': 'Zoomed Image'})[0];
    this.$modal.find('.modal-content').html(newImage);
    this.$modal.modal();
  },

  addExamPageNumbers: function() {
    // Add the correct exam page number to each thumbnail, where a selected page
    // has page number 1 and each subsequent page increments.
    var self = this;
    var examPageNum;
    var $imageContainers = this.$('.image-container');

    var curFirstPageNum;
    var nextFirstPageNum;

    $imageContainers.each(function(i) {
      var $imageContainer = $(this);
      if ($imageContainer.hasClass('selected')) {
        examPageNum = 1;
      } else if (examPageNum) {
        examPageNum += 1;
      } else {
        examPageNum = self.imageContainerFirstPageNums[self.curPage];
      }

      // Update `imageContainerFirstPageNums` with the current page's first page
      // and the next page's first page. We don't update the current page's first
      // page if the first image is selected, since if it is deselected, we want
      // to be able to recover the previous page number.
      if (i === 0 && !$imageContainer.hasClass('selected')) {
        self.imageContainerFirstPageNums[self.curPage] = examPageNum;
      }
      self.imageContainerFirstPageNums[self.curPage + 1] = examPageNum;

      var pageNumToShow = examPageNum ? examPageNum : '&mdash;';
      $imageContainer.find('.exam-page-num').html(pageNumToShow);
    });

    // At the very end, add one to find the first number of the next set of images
    this.imageContainerFirstPageNums[self.curPage + 1] += 1;
  }
});

$(function() {
  new SplitView({ el: $('.split') });
});
