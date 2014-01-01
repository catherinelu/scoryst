$(function() { 

  var examsArray;
  var currentIndex = -1;
  
  var $canvas = $('<img />').appendTo('.exam-canvas');
  var $window = $(window);
  var $previousStudent = $('.previous-student');
  var $nextStudent = $('.next-student');

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
  // Makes the assumption th
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

  // Displays the image at currentIndex + offset and updates currentIndex
  function displayImage(offset) {
    // The user only wants to see unmapped exams
    if ($('input[name=show-mapped]').filter(':checked').val() == 'unmapped') {
      offset = getOffsetToUnmapped(offset);
    }

    if (currentIndex + offset < 0 || currentIndex + offset >= examsArray.length) {
      return;
    }

    currentIndex += offset;

    $canvas
    .attr('src', examsArray[currentIndex].url)
    .load(function() {
      // This image is already mapped to a student, so show the student name
      if (examsArray[currentIndex]['mappedTo']) {
        $('.typeahead').typeahead('setQuery', examsArray[currentIndex]['mappedTo']).focus();
      } else {
        $('.typeahead').typeahead('setQuery', '').focus();
      }

      $window.resize();
    });

    // Cache the images from the URLs
    var images = [];
    for (i = -2; i <= 4; i++) {
      images[i] = new Image();
      if (examsArray[currentIndex + i]) {
        images[i].src = examsArray[currentIndex + i].url;
      } else if (i > 0) {
        break;
      }
    }
  }

  // Makes an ajax call to retrieve the exams and displays the first of them
  function getAllExams() {
    $.ajax({
      url: 'get-all-exams',
      dataType: 'json'
    }).done(function(data) {
      examsArray = data;
      displayImage(1);
    }).fail(function(request, error) {
      console.log('Error while getting unmapped exams');
    });
  }

  // Maps the current exam being displayed to the student specified by datum
  function mapExam(datum) {
    var examAnswerId = examsArray[currentIndex].examAnswerId;
    var courseUserId = datum['courseUserId'];
    $.ajax({
      url: examAnswerId + '/' + courseUserId,
      dataType: 'text'
    }).done(function(data) {
      datum['mapped']= true;
      examsArray[currentIndex]['mappedTo'] = datum['name'];
      displayImage(1);
    }).fail(function(request, error) {
      console.log('Error while mapping exams');
    });
  }

  $previousStudent.click(function() {
    displayImage(-1);
  });

  $nextStudent.click(function() {
    displayImage(1);
  });

});
