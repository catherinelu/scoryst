// TODO: anonymous function
// TODO: duplicate PDF code
var PDF_SCALE = 1.3;
var $canvas = $('.exam-canvas canvas');
var context = $canvas[0].getContext('2d');
var pdfDoc = null;
var $previousPage = $('.previous-page');
var $nextPage = $('.next-page');

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
/* Resizes the page navigation to match the canvas height. */
function resizePageNavigation() {
  $previousPage.height($canvas.height());
  $nextPage.height($canvas.height());
}

$(window).resize(resizePageNavigation);

// TODO: $(document).ready() please or just $(function() { ... })
$().ready(function () {
  initTypeAhead();
  PDFJS.disableWorker = true;
  var start = +new Date();  // log start timestamp
  PDFJS.getDocument('/course/1/create-exam/1/get-empty-exam').then(
    function getPdf(_pdfDoc) {
      var end =  +new Date();  // log end timestamp
      var diff = end - start;
      console.log(diff/1000);
      pdfDoc = _pdfDoc;
      renderPage(1);
    },
    function getPdfError(message, exception) {
      // TODO:
      alert(message);
    }
  );    
});

function initTypeAhead() {
  // Enables use of handlebars templating engine along with typeahead
  var T = {};
  T.compile = function (template) {
    var compile = Handlebars.compile(template),
      render = {
        render: function (ctx) {
          return compile(ctx);
        }
      };
    return render;
  };

  // Expected format of each element in array from prefetch:
  // {
  //   'name': 'Karanveer Mohan',
  //   'email': 'kvmohan@stanford.edu',
  //   'student_id': 05716513,
  //   'tokens': ['Karanveer', 'Mohan']
  // }
  $('.typeahead').typeahead({
    name: 'a',
    prefetch: {
      url: window.location.pathname + 'students-info',
      ttl: 1
    },
    template: [
      '<p><strong>{{name}}</strong></p>',
      '<p>{{email}} {{student_id}}</p>',
      '{{#if mapped}}<p class="error">ALREADY MAPPED</p>{{/if}}'
    ].join(''),
    engine: T,
    valueKey: 'name'
  }).on('typeahead:selected', function (obj, datum) {
    console.log(obj);
    console.log(datum);
    datum['mapped']= true;
  });
}

