function ImageLoader(curPageNum, preloadPage, preloadStudent) {
  this.$canvas = $('<img />').appendTo('.exam-canvas');
  this.$window = $(window);
  this.$previousPage = $('.previous-page');
  this.$nextPage = $('.next-page');

  this.curPageNum = curPageNum;
  this.preloadPage = preloadPage;
  this.preloadStudent = preloadStudent;

  // Used for timeouts
  this.timer;

  this.getNumPages();
  this.showPage(this.curPageNum);
}

ImageLoader.prototype.preload = function() {
  var url_array = [];
  var i;

  // Number of previous and next images that will be prefetched
  var PREFETCH_NUMBER = 2;
  var curPageNum = this.curPageNum;

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

// curQuestionNum and curPartNum are only needed if we are preloading
// jpegs for next and previous students
ImageLoader.prototype.showPage = function(num, curQuestionNum, curPartNum) {
  var obj = this;
  if (num < 1 || num > obj.numPages) return;
  obj.curPageNum = num;
  function loadImage() {
    obj.$canvas.error(function(){

      window.clearTimeout(obj.timer);
      
      var load_src = '/static/img/loading_big.gif';
      this.src = load_src;

      obj.timer = window.setTimeout(function(){loadImage();}, 2000);
    }).attr('src', 'get-exam-jpeg/' + num).load(function() {
      obj.$window.resize();
      obj.resizePageNavigation();
    });
  }
  loadImage();
  obj.preload(curQuestionNum, curPartNum);
};

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

/* Resizes the page navigation to match the canvas height. */
ImageLoader.prototype.resizePageNavigation = function() {
  this.$previousPage.height(this.$canvas.height());
  this.$nextPage.height(this.$canvas.height());
};
