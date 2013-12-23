function ImageLoader(curPageNum, preloadPage, preloadStudent) {
  this.$canvas = $('.exam-canvas img');
  this.$window = $(window);
  this.$previousPage = $('.previous-page');
  this.$nextPage = $('.next-page');

  this.curPageNum = curPageNum;
  this.preloadPage = preloadPage;
  this.preloadStudent = preloadStudent;

  this.getNumPages();
  this.showPage(this.curPageNum);
};

ImageLoader.prototype.preload = function() {
  var url_array = [];
  var curPageNum = this.curPageNum;
  
  // Add urls for next and previous pages
  if (this.preloadPage) {
    // TODO: We'll be getting URLs like /-1 but those are 404 so we don't care anyway?
    var pageNumList = [curPageNum - 2, curPageNum - 1, curPageNum + 1, curPageNum + 2];
    
    url_array = url_array.concat(pageNumList.map(function(num) {
      return 'get-exam-jpeg/' + num;
    }));
  }

  // Add urls for preloading next and previous students
  if (this.preloadStudent) {
    url_array.push('get-previous-student-jpeg/' + curQuestionNum + '/' + curPartNum)
    url_array.push('get-next-student-jpeg/' + curQuestionNum + '/' + curPartNum)
  }

  // Cache the images from the URLs
  var images = new Array();
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
  obj.$canvas.attr('src', 'get-exam-jpeg/' + num).load(function() {
    obj.$window.resize();
    obj.resizePageNavigation();
  });
  obj.preload(curQuestionNum, curPartNum);
}

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
      obj.goToPage(obj.numPages);
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
