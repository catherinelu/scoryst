// TODO: docs
function renderPage(pageNum, pdfDoc) {
  // TODO: constants should go outside of function at the top of file
  // TODO: explain what this number means
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
      resizeNav();
    });
  });
}

// TODO: docs; if this is global, explicitly do window.goToPage = ...
goToPage = function(pageNum, pdfDoc) {
  if (pageNum < 1 || pageNum > pdfDoc.numPages) return;
  renderPage(pageNum, pdfDoc);
// TODO: semicolon at the end of a variable function
}

// TODO: docs; if this is global, explicitly do window.showPdf = ...
showPdf = function(url, currPage, callbackfn) {
  PDFJS.disableWorker = true;
  PDFJS.getDocument(url).then(
    // TODO: stop naming things with underscores
    function getPdf(_pdfDoc) {
      var pdfDoc = _pdfDoc;
      renderPage(currPage, pdfDoc);
      // TODO: semicolon
      callbackfn(pdfDoc)
    },
    function getPdfError(message, exception) {
      // TODO: no alerts
      alert(message);
    }
  );
// TODO: semicolon at the end of a variable function
}
