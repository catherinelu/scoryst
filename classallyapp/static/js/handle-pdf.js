
  var PDF_SCALE = 1.3;
  var $canvas = $('.exam-canvas canvas');
  var context = $canvas[0].getContext('2d');

  var $previousPage = $('.previous-page');
  var $nextPage = $('.next-page');

  var url = '/static/pdf/empty-cs221.pdf';
  var pdfDoc = null;
  var curPage = 1;

  /* Get page info, resize canvas accordingly, and render PDF page. */
  function renderPDFPage(num) {
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

  PDFJS.disableWorker = true;
  PDFJS.getDocument(url).then(
    function getPdf(_pdfDoc) {
      pdfDoc = _pdfDoc;
      renderPDFPage(curPage);
    },
    function getPdfError(message, exception) {
      // TODO:
      alert(message);
    }
  );

  /* Resizes the page navigation to match the canvas height. */
  function resizePageNavigation() {
    $previousPage.height($canvas.height());
    $nextPage.height($canvas.height());
  }
  $(window).resize(resizePageNavigation);

  function goToPage(num) {
    if (num < 1 || num > pdfDoc.numPages) return;
    curPage = num;
    renderPDFPage(curPage);
  }