$(function() { 
  
  // To whoever looks at this file:
  // There are 10,000 TODOs in this file, functionality and style wise. Don't bother yourself.

  var unmappedExamsArray;
  var currentIndex = -1;
  
  var $canvas = $('<img />').appendTo('.exam-canvas');
  var $window = $(window);
  var $previousPage = $('.previous-page');
  var $nextPage = $('.next-page');

  initTypeAhead();
  getUnmappedExams();

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
        url: window.location.pathname + 'get-all-course-students',
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

  // Displays the image at currentIndex + offset and updates currentIndex
  function displayImage(offset) {
    if (currentIndex + offset < 0 || currentIndex + offset >= unmappedExamsArray.length) {
      return;
    }

    currentIndex += offset;

    $canvas
    .attr('src', unmappedExamsArray[currentIndex].url)
    .load(function() {
      // This image is already mapped to a student, so show the student name
      if (unmappedExamsArray[currentIndex]['student']) {
        $('.typeahead').val(unmappedExamsArray[currentIndex]['student']['name'])
      } else {
        $('.typeahead').val('')
      }

      $window.resize();
      resizePageNavigation();
    });

    // Cache the images from the URLs
    var images = [];
    for (i = -2; i <= 4; i++) {
      images[i] = new Image();
      if (unmappedExamsArray[currentIndex + i]) {
        images[i].src = unmappedExamsArray[currentIndex + i].url;
      } else if (i > 0){
        break;
      }
    }
  }

  // Makes an ajax call to retrieve the unmapped exams and displays the first of them
  function getUnmappedExams() {
    $.ajax({
      url: 'get-all-unmapped-exams',
      dataType: 'json'
    }).done(function(data) {
      unmappedExamsArray = data;
      displayImage(1);
    }).fail(function(request, error) {
      console.log('Error while getting unmapped exams');
    });
  }

  // Maps the current exam being displayed to the student specified by datum
  function mapExam(datum) {
    var examAnswerId = unmappedExamsArray[currentIndex].examAnswerId;
    var courseUserId = datum['courseUserId'];
    $.ajax({
      url: examAnswerId + '/' + courseUserId,
      dataType: 'text'
    }).done(function(data) {
      datum['mapped']= true;
      unmappedExamsArray[currentIndex]['student'] = datum;
      displayImage(1);
    }).fail(function(request, error) {
      console.log('Error while mapping exams');
    });
  }

  $previousPage.click(function(){
    displayImage(-1);
  });

  $nextPage.click(function(){
    displayImage(1);
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
      $previousPage.click();
      return false;
    }

    // Right Arrow Key: Go back a page in the exam
    if (event.keyCode == 39) { 
      $nextPage.click();
      return false;
    }
  });

  function resizePageNavigation() {
    $previousPage.height($canvas.height());
    $nextPage.height($canvas.height());
  };
});