function renderPage(pageNum, pdfDoc) {
  var PDF_SCALE = 1.3;
  var $canvas = $('.exam-canvas canvas');
  var context = $canvas[0].getContext('2d');

  pdfDoc.getPage(pageNum).then(function(page) {
    var viewport = page.getViewport(PDF_SCALE);
    $canvas.prop('height', viewport.height);
    $canvas.prop('width', viewport.width);


    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    page.render(renderContext).then(function() {
      $('.previous-page').height($canvas.height());
      $('.next-page').height($canvas.height());    
    });
  });
}

goToPage = function(pageNum, pdfDoc) {
  if (pageNum < 1 || pageNum > pdfDoc.numPages) return;
  renderPage(pageNum, pdfDoc);
}

showPdf = function(pdfDoc, url, currPage) {
  PDFJS.disableWorker = true;
  PDFJS.getDocument(url).then(
    function getPdf(_pdfDoc) {
      pdfDoc = _pdfDoc;
      renderPage(currPage, pdfDoc);
    },
    function getPdfError(message, exception) {
      alert(message);
    }
  );
}