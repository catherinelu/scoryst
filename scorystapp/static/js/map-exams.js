$(function() { 

  var examsArray;
  var currentIndex = -1;
  
  var $previousExam = $('.previous-exam');
  var $nextExam = $('.next-exam');

  var imageLoader = new ImageLoader(1, { preloadPage: false }, 
    { preloadStudent: true, prefetchNumber: 4 });
  initTypeAhead();
  getAllExams();

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
        url: 'get-all-course-students',
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
      // When the user selects an option, call mapExam and pass the data associated
      // with the option selected, which is the same as the prefetched data
      mapExam(datum);
    });
  }

  // Returns the offset to the next unmapped student
  function getOffsetToUnmapped(offset) {
    // Take care of negative step sizes
    stepSize = Math.abs(offset)/offset;

    // Loop as long as we are within bounds and on an already mapped exam
    while (currentIndex + offset >= 0 && currentIndex + offset < examsArray.length 
      && examsArray[currentIndex + offset]['mappedTo']) {
      offset += stepSize;
    }
    return offset;
  }

  function displayExamAtOffset(offset) {
    // The user only wants to see unmapped exams
    if ($('input[name=show-mapped]').filter(':checked').val() == 'unmapped') {
      offset = getOffsetToUnmapped(offset);
    }

    if (currentIndex + offset < 0 || currentIndex + offset >= examsArray.length) {
      return;
    }

    prevIndex = currentIndex;
    currentIndex += offset;

    var currentPath = window.location.pathname;
    currentPath = currentPath.replace('/map/' + examsArray[prevIndex].examAnswerId, 
      '/map/' + examsArray[currentIndex].examAnswerId);

    // update URL with history API; fall back to standard redirect
    if (window.history) {
      window.history.pushState(null, null, currentPath);
      displayExam();
    } else {
      window.location.pathname = currentPath;
    }
  }


  // Makes the back button work by handling the popState event.
  $(window).bind('popstate', function() {
    displayExam();
  });

  // Display the exam corresponding to the URL being shown
  function displayExam() {
    // The URL has changed, so image loader will show the new exam
    imageLoader.showPage(imageLoader.curPageNum);

    // This image is already mapped to a student, so show the student name
    if (examsArray[currentIndex]['mappedTo']) {
      $('.typeahead').typeahead('setQuery', examsArray[currentIndex]['mappedTo']).focus();
    } else {
      $('.typeahead').typeahead('setQuery', '').focus();
    }    
  }

  // Makes an ajax call to retrieve the exams and displays the one
  // corresponding to exam_answer_id in the url
  function getAllExams() {
    $.ajax({
      url: 'get-all-exams',
      dataType: 'json'
    }).done(function(data) {
      examsArray = data['exams'];
      currentIndex = data['currentIndex'];
      console.log(currentIndex);
      displayExam();
    }).fail(function(request, error) {
      console.log('Error while getting exams');
    });
  }

  // Maps the current exam being displayed to the student specified by datum
  function mapExam(datum) {
    var examAnswerId = examsArray[currentIndex].examAnswerId;
    var courseUserId = datum['courseUserId'];
    $.ajax({
      url: 'to/' + courseUserId,
      dataType: 'text'
    }).done(function(data) {
      datum['mapped']= true;
      examsArray[currentIndex]['mappedTo'] = datum['name'];
      displayExamAtOffset(1);
    }).fail(function(request, error) {
      console.log('Error while mapping exams');
    });
  }

  // Implement left and right click. Just changes one page at a time.
  imageLoader.$previousPage.click(function() {
    imageLoader.showPageFromCurrent(-1);
  });

  imageLoader.$nextPage.click(function() {
    imageLoader.showPageFromCurrent(+1);
  });

  // Previous and next student exam
  $previousExam.click(function() {
    displayExamAtOffset(-1);
  });

  $nextExam.click(function() {
    displayExamAtOffset(1);
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
