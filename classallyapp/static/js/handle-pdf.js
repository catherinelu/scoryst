var $canvas = $('.exam-canvas img');

var $previousPage = $('.previous-page');
var $nextPage = $('.next-page');

var curPage = 1;
var numPages;

/* Resizes the page navigation to match the canvas height. */
function resizePageNavigation() {
  $previousPage.height($canvas.height());
  $nextPage.height($canvas.height());
}

function goToPage(num) {
  if (num < 1 || num > numPages) return;
  curPage = num;
  $canvas.attr('src', 'get-exam-jpeg/' + num).load(function() {
    $(window).resize();
    resizePageNavigation();
  });
}

goToPage(1);

$.ajax({
  url: 'get-page-count',
  dataType: 'text'
}).done(function(data) {
  numPages = parseInt(data, 10);
  if (curPage > numPages) {
    goToPage(numPages);
  }
}).fail(function(request, error) {
  console.log(error);
});