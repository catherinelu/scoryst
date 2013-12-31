// ImageLoader class handles asynchronously loading jpegs as well as preloading
// images for better performance. In case of errors, it also handles showing
// a loading gif and periodically attempting to fetch the image again
// Arguments:
// curPageNum: page number to be initially loaded
// preloadPage (boolean): whether to preload previous and next pages for current student
// preloadStudent (boolean): whether to preload next and previous students
function ImageLoader(curPageNum, preloadPage, preloadStudent) {
  this.$canvas = $('<img />').appendTo('.exam-canvas');
  this.$window = $(window);
  this.$previousPage = $('.previous-page');
  this.$nextPage = $('.next-page');

  this.curPageNum = curPageNum;
  this.preloadPage = preloadPage;
  this.preloadStudent = preloadStudent;

  // Makes an ajax call and updates the number of pages associated with the pdf
  this.asyncSetNumPages();
  this.showPage(this.curPageNum);
}

// Number of previous and next images that will be prefetched
ImageLoader.PREFETCH_NUMBER = 2;

// Called from showPage() to preload images based if either preloadPage or
// preloadStudent (or both) are true
ImageLoader.prototype.preload = function() {
  var urlArray = [];
  var i;

  var curPageNum = this.curPageNum;

  var firstPrefetchIndex = curPageNum - ImageLoader.PREFETCH_NUMBER;
  var lastPrefetchIndex = curPageNum + ImageLoader.PREFETCH_NUMBER;

  // Ensure we don't load non-positive indices
  if (firstPrefetchIndex <= 0) {
    firstPrefetchIndex = 1;
  }
  
  if (this.numPages && lastPrefetchIndex > this.numPages) {
    lastPrefetchIndex = this.numPages;
  }

  // Add urls for next and previous pages
  if (this.preloadPage) {
    for (i = firstPrefetchIndex; i <= lastPrefetchIndex; i++) {
      urlArray.push('get-exam-jpeg/' + i);
    }
  }

  // Add urls for preloading next and previous students
  if (this.preloadStudent && curQuestionNum && curPartNum) {
    urlArray.push('get-previous-student-jpeg/' + curQuestionNum + '/' + curPartNum);
    urlArray.push('get-next-student-jpeg/' + curQuestionNum + '/' + curPartNum);
  }

  // Cache the images from the URLs
  var images = [];
  for (i = 0; i < urlArray.length; i++) {
    images[i] = new Image();
    images[i].src = urlArray[i];
  }
};

// Shows the page corresponding to num. If the server returns an error, shows a loading
// gif and attempts to load the image again after a set interval
// curQuestionNum and curPartNum are only needed if we are preloading
// jpegs for next and previous students
ImageLoader.prototype.showPage = function(num, curQuestionNum, curPartNum) {
  var obj = this;
  if (num < 1 || num > obj.numPages) return;
  obj.curPageNum = num;

  // Resize after showing the loading gif
  var resized = false;
  var loadSrc = '/static/img/loading_big.gif';
  
  // Attempts to load image corresponding to page given by num, and shows loading gif
  // in case of failure
  function loadImage() {
    obj.$canvas.error(function(){

      this.src = loadSrc;

      // Since loading the image failed, we will once again try to load it after 2 seconds
      obj.timer = window.setTimeout(function() {
        loadImage();
      }, 2000);

    }).attr('src', 'get-exam-jpeg/' + num).load(function() {

      // We may fail multiple times in loading the image, however, we don't
      // want to call resize and resizePageNavigation each time
      if (this.src.indexOf(loadSrc) < 0 || !resized) {
        resized = true;
        obj.$window.resize();
        obj.resizePageNavigation();
      }
    });
  }
  loadImage();
  obj.preload(curQuestionNum, curPartNum);
};

// Sets the number of pages associated with the exam being shown
// Needed so that we don't go past the last page
ImageLoader.prototype.asyncSetNumPages = function() {
  var obj = this;
  $.ajax({
    url: 'get-exam-page-count',
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

// Resizes the page navigation to match the canvas height.
ImageLoader.prototype.resizePageNavigation = function() {
  this.$previousPage.height(this.$canvas.height());
  this.$nextPage.height(this.$canvas.height());
};
