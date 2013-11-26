// Copied the PDF code from create-exam.html
var PDF_SCALE = 1.3;
var $canvas = $('.exam-canvas canvas');
var context = $canvas[0].getContext('2d');

var $previousPage = $('.previous-page');
var $nextPage = $('.next-page');

var url = 'static/pdf/empty-cs221.pdf';
var pdfDoc = null;
var currPage = 1;

/* Resizes the page navigation to match the canvas height. */
function resizePageNavigation() {
  $previousPage.height($canvas.height());
  $nextPage.height($canvas.height());
}

$(window).resize(resizePageNavigation);

// Get page info from document, resize canvas accordingly, and render page
function renderPage(num) {
  pdfDoc.getPage(num).then(function(page) {
    var viewport = page.getViewport(PDF_SCALE);
    $canvas.prop('height', viewport.height);
    $canvas.prop('width', viewport.width);


    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    page.render(renderContext).then(function() {
      resizeNav();
      resizePageNavigation();
    });
  });
}

function goToPage(num) {
  if (num < 1 || num > pdfDoc.numPages) return;
  pageNum = num;
  renderPage(pageNum);
}

$(function() {
  /* To toggle the question navigation. */
	$('.grade .question-nav > a').click(function() {
		if ($('.grade .question-nav ul').css('display') == 'none') {
			$('.grade .question-nav ul').css('display', 'inherit');		
			$('.grade .question-nav i').attr('class', 'fa fa-minus-circle fa-lg');
		} else {
			$('.grade .question-nav ul').css('display', 'none');
			$('.grade .question-nav i').attr('class', 'fa fa-plus-circle fa-lg');
		}
	});

  /* To select/deselect rubrics. */
  $('.grade .grading-rubric a').click(function() {
    if ($(this).text().indexOf('Custom score') == -1) {
      $(this).parent().toggleClass('selected');    
    }
  })

  PDFJS.disableWorker = true;
  PDFJS.getDocument(url).then(
    function getPdf(_pdfDoc) {
      pdfDoc = _pdfDoc;
      renderPage(currPage);
    },
    function getPdfError(message, exception) {
      alert(message);
    }
  );
});

$previousPage.click(function(){
  if (currPage <= 1) return;
  currPage--;
  goToPage (currPage);
});


$nextPage.click(function(){
  if (currPage >= pdfDoc.numPages) return;
  currPage++;
  goToPage(currPage);
});

$(document).keydown(function(e) {
  var $target = $(event.target);
  if ($target.is('input') || $target.is('textarea')) {
    return;
  }

  // Left Key
  if (e.keyCode == 37) { 
     $previousPage.click();
     return false;
  }
  // Right Key
  if (e.keyCode == 39) { 
     $nextPage.click();
     return false;
  }
});