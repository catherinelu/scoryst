// TODO: docs
function ImageLoader(curPageNum, preloadPage, preloadStudent) {
  this.$canvas = $('<img />').appendTo('.exam-canvas');
  this.$window = $(window);
  this.$previousPage = $('.previous-page');
  this.$nextPage = $('.next-page');

  this.curPageNum = curPageNum;
  this.preloadPage = preloadPage;
  this.preloadStudent = preloadStudent;

  // TODO (kvmohan): why is this here? this is a useless statement
  // Used for timeouts
  this.timer;

  // TODO (kvmohan): getNumPages should take in a callback, and showPage()
  // should be called in the callback
  this.getNumPages();
  this.showPage(this.curPageNum);
}

// TODO: docs
ImageLoader.prototype.preload = function() {
  // TODO: no underscores
  var url_array = [];
  var i;

  // Number of previous and next images that will be prefetched
  // TODO: define this constant statically on ImageLoader;
  // i.e. ImageLoader.PREFETCH_NUMBER = 2;
  var PREFETCH_NUMBER = 2;
  var curPageNum = this.curPageNum;

  // TODO (kvmohan): don't mix underscores and camel case
  var first_prefetch_index = curPageNum - PREFETCH_NUMBER;
  var last_prefetch_index = curPageNum + PREFETCH_NUMBER;

  // Ensure we don't load non-positive indices
  if (first_prefetch_index <= 0) {
    first_prefetch_index = 1;
  }
  
  if (this.numPages && last_prefetch_index > this.numPages) {
    last_prefetch_index = this.numPages;
  }

  // Add urls for next and previous pages
  if (this.preloadPage) {
    for (i = first_prefetch_index; i <= last_prefetch_index; i++) {
      url_array.push('get-exam-jpeg/' + i);
    }
  }

  // Add urls for preloading next and previous students
  if (this.preloadStudent) {
    url_array.push('get-previous-student-jpeg/' + curQuestionNum + '/' + curPartNum);
    url_array.push('get-next-student-jpeg/' + curQuestionNum + '/' + curPartNum);
  }

  // Cache the images from the URLs
  var images = [];
  for (i = 0; i < url_array.length; i++) {
    images[i] = new Image();
    images[i].src = url_array[i];
  }
};

// TODO: docs
// curQuestionNum and curPartNum are only needed if we are preloading
// jpegs for next and previous students
ImageLoader.prototype.showPage = function(num, curQuestionNum, curPartNum) {
  var obj = this;
  if (num < 1 || num > obj.numPages) return;
  obj.curPageNum = num;
  // Resize after showing the loading gif
  var resized = false;
  var load_src = '/static/img/loading_big.gif';
  // TODO (kvmohan): comment this sub-function, add more blank lines in showPage() function,
  // clean up spacing in the error handler below
  function loadImage() {
    obj.$canvas.error(function(){

      window.clearTimeout(obj.timer);
      this.src = load_src;

      // TODO (kvmohan): bad one line function. Add more spacing for clarity
      obj.timer = window.setTimeout(function(){loadImage();}, 2000);
    }).attr('src', 'get-exam-jpeg/' + num).load(function() {
      if (this.src.indexOf(load_src) < 0 || !resized) {
        console.log("Resize");
        resized = true;
        obj.$window.resize();
        obj.resizePageNavigation();
      }
    });
  }
  loadImage();
  obj.preload(curQuestionNum, curPartNum);
};

// TODO: docs
ImageLoader.prototype.getNumPages = function() {
  var obj = this;
  $.ajax({
    url: 'get-page-count',
    dataType: 'text'
  }).done(function(data) {
    obj.numPages = parseInt(data, 10);
    // Needed in the case that numPages wasn't set and user tried to go to
    // a page beyond it.
    if (obj.curPageNum > obj.numPages) {
      obj.showPage(obj.numPages);
    }
  }).fail(function(request, error) {
    console.log(error);
  });
};

// TODO: be consistent with function docs; either use block comments or inline
// comments for all of them
/* Resizes the page navigation to match the canvas height. */
ImageLoader.prototype.resizePageNavigation = function() {
  this.$previousPage.height(this.$canvas.height());
  this.$nextPage.height(this.$canvas.height());
};
