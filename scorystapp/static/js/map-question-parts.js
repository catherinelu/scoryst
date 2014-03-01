$(function() { 
  
  var imageLoader = new ImageLoader(1, { preloadPage: true, prefetchNumber: 4 }, 
    { preloadStudent: false});
  
  var $optionsTemplate = $('.options-template');
  var optionsTemplate = Handlebars.compile($optionsTemplate.html());
  
  var $questionsSelect = $('.questions');
  var $partsSelect = $('.parts');
  var $pagesInput = $('.pages');
  var $saveButton = $('.save');
  var $currentPageNum = $('.current-page-number');
  
  // Questions is an array with the i-th index corresponding to the number of parts
  // the (i+1)th question has
  var questions;

  initTypeAhead();
  getAllQuestionParts();

  // Initializes the functionality for typeahead.js
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
    //   'student_id': 01234567,
    //   'tokens': ['Karanveer', 'Mohan']
    // }
    $('.typeahead').typeahead({
      prefetch: {
        url: 'get-all-exam-answers/',
      },
      template: [
        '<p><strong>{{name}}</strong></p>',
        '<p>{{email}} {{studentId}}</p>',
        '{{#if mapped}}<p class="error">ALREADY MAPPED</p>{{/if}}'
      ].join(''),
      limit: 6,
      engine: T,
      valueKey: 'name'
    }).on('typeahead:selected', function (obj, datum) {
      var url = window.location.href
      var replaceAfterStr = 'map-question-parts/'
      var index = url.indexOf(replaceAfterStr);
      window.location.href = url.substr(0, index + replaceAfterStr.length) + datum['exam_answer_id'];
    });
  }

  // Returns an array: [start, start + 1 ... end]
  function range(start, end) {
    var foo = [];
    for (var i = start; i <= end; i++) {
      foo.push(i);
    }
    return foo;
  }

  // Makes an ajax call to get the array where the i-th index corresponds to
  // the number of parts the (i+1)th question has for the give exam
  function getAllQuestionParts() {
    $.ajax({
      url: 'get/',
      dataType: 'json'
    }).done(function(data) {
      questions = data['questions'];
      // Handlebars can't tolerate one-indexing, so I need to do this shit.
      $questionsSelect.html(optionsTemplate(range(1, questions.length)));
      showPart();
    }).fail(function(request, error) {
      console.log('Error while getting all question parts');
    });
  }

  // Shows the correct range of parts for the current question
  // i.e if question 2 only has 2 parts, we'll only have two options in the select list
  function showPart() {
    var questionNumber = $questionsSelect.find(':selected').text();
    if (questions) {
      var parts = range(1, questions[questionNumber - 1]);
      $partsSelect.html(optionsTemplate(parts));
    }
    getPagesForQuestionPart();
  }

  // Gets the pages associated with the 'question_part_answer' corresponding to the
  // questionNumber and partNumber for the current studemt
  function getPagesForQuestionPart() {
    var questionNumber = $questionsSelect.find(':selected').text();
    var partNumber = $partsSelect.find(':selected').text();
    $.ajax({
      url: 'get/' + questionNumber + '/' + partNumber + '/',
    }).done(function(data) {
      $pagesInput.val(data);
    }).fail(function(request, error) {
      console.log('Error while getting pages');
    });
  }

  // When the user chooses a new question, update the parts being shown
  $questionsSelect.change(function() {
    showPart();
  });

  // When the user chooses a new part, update the pages associated with this new question/part
  $partsSelect.change(function() {
    getPagesForQuestionPart();
  });

  // Saves the pages associated with the current question / part after validation
  $saveButton.click(function() {
    var questionNumber = $questionsSelect.find(':selected').text();
    var partNumber = $partsSelect.find(':selected').text();
    var pages = $pagesInput.val();
    success = validatePages(pages);
    
    if (!success) {
      $('.error').html('Please enter comma separated pages within the range ' + 
        '[1, numPages] in the form: 1,2,3');
      return;
    }

    $.ajax({
      url: 'update/' + questionNumber + '/' + partNumber + '/' + encodeURIComponent(pages) + '/',
    }).done(function(data) {
      $('.success').show().delay(3000).fadeOut();
    }).fail(function(request, error) {
      alert('Save failed: ' + error);
    });
  });

  function validatePages(pages) {
    pages = pages.split(',');
    for(var i = 0; i < pages.length; i++) {
      var page = pages[i];
      if(isNaN(page)) {
        return false;
      }
      // TODO: Replace num pages with catherine's numpages function in imageloader
      if (parseInt(page) <= 0 || parseInt(page) > imageLoader.numpages) {
        return false;
      }
    }
    return true;
  }

  // Makes the back button work by handling the popState event.
  $(window).bind('popstate', function() {
    imageLoader.showPage(imageLoader.curPageNum);
    $currentPageNum.html(imageLoader.curPageNum);
  });

  // Implement left and right click. Just changes one page at a time.
  imageLoader.$previousPage.click(function() {
    imageLoader.showPageFromCurrent(-1);
    $currentPageNum.html(imageLoader.curPageNum);
  });

  imageLoader.$nextPage.click(function() {
    imageLoader.showPageFromCurrent(+1);
    $currentPageNum.html(imageLoader.curPageNum);
  });


  $(document).keydown(function(event) {
    var $target = $(event.target);
    // If the focus is in an input box or text area, we don't want the page
    // to be changing
    if ($target.is('input') || $target.is('textarea')) {
      return;
    }

    // Left Arrow Key: Advance the exam
    if (event.keyCode == 37) {
       imageLoader.$previousPage.click();
       return false;
    }

    // Right Arrow Key: Go back a page in the exam
    if (event.keyCode == 39) { 
       imageLoader.$nextPage.click();
       return false;
    }
  });  
});
