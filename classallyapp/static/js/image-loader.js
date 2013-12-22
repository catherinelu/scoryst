var $canvas = $('.exam-canvas img');

var $previousPage = $('.previous-page');
var $nextPage = $('.next-page');

function ImageLoader(curPageNum, preloadPage, preloadStudent) {
  this.curPageNum = curPageNum;
  this.preloadPage = preloadPage;
  this.preloadStudent = preloadStudent;

  this.getNumPages();
  this.showPage(this.curPageNum);
};

ImageLoader.prototype.preload = function() {
  var url_array = [];
  var curPageNum = this.curPageNum;
  if (this.preloadPage) {
    // TODO: We'll be getting URLs like /-1 but those are 404 so we don't care anyway?
    var pageNumList = [curPageNum - 2, curPageNum - 1, curPageNum + 1, curPageNum + 2];
    url_array = url_array.concat(pageNumList.map(function(num) {
      return 'get-exam-jpeg/' + num;
    }));
    console.log(url_array);
  }
  if (this.preloadStudent) {
    // TODO: Figure out how to get jpegs of next and previous students?
  }
  var images = new Array();
  for (i = 0; i < url_array.length; i++) {
    images[i] = new Image();
    images[i].src = url_array[i];
  }
};

ImageLoader.prototype.showPage = function(num) {
  if (num < 1 || num > this.numPages) return;
  this.curPageNum = num;
  $canvas.attr('src', 'get-exam-jpeg/' + num).load(function() {
    $(window).resize();
    resizePageNavigation();
  });
  this.preload();
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
function resizePageNavigation() {
  $previousPage.height($canvas.height());
  $nextPage.height($canvas.height());
}