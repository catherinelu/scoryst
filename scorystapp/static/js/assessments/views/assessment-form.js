var AssessmentFormView = IdempotentView.extend({
  events: {
    'change input[type="radio"]:checked#id_assessment_type_0': 'showHomeworkFields',
    'change input[type="radio"]:checked#id_assessment_type_1': 'showExamFields',
    'keydown .num-questions': 'debounceGetNumQuestions',
    'keydown .num-parts': 'debounceGetNumParts',
    'keydown .points': 'validatePoints',
    'click button.submit': 'submit'
  },

  templates: {
    questionFormTemplate: _.template($('.question-form-template').html()),
    partFormTemplate: _.template($('.part-form-template').html())
  },

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);

    this.assessment = options.assessment;
    this.isExam = false;
    this.debounceGetNumQuestions = _.debounce(this.getNumQuestions, 500);
    this.debounceGetNumParts = _.debounce(this.getNumParts, 500);

    $('#id_submission_deadline_picker').datetimepicker({'format': 'MM/DD/YYYY HH:mm'});

    // if editing an existing assessment, populate the fields corresponding to
    // the saved values
    if (this.assessment) {
      this.questionParts = new QuestionPartCollection();
      var self = this;
      this.questionParts.fetch({
        success: function() {
          self.populateFields();
        }
      });
    }

    this.addPopover();
  },

  showHomeworkFields: function(event) {
    this.isExam = false;
    $('.homework-fields').show();
    $('.exam-fields').hide();
    $('#id_name').attr('placeholder', 'Problem Set 1');
  },

  showExamFields: function() {
    this.isExam = true;
    $('.homework-fields').hide();
    $('.exam-fields').show();
    $('#id_name').attr('placeholder', 'Midterm Exam');
  },

  addPopover: function() {
    var infoPopoverText = 'Exams can be graded down or up. If grading down, exams' +
      ' have perfect scores initially, and each rubric selected deducts points from' +
      ' the total score. If grading up, exams have 0 points awarded initially, and' +
      ' each rubric selected awards points to the total score.';

    var $infoPopover = this.$('.info-popover');
    $infoPopover.popover({ content: infoPopoverText });
  },

  getNumQuestions: function(event) {
    var numQuestions = parseInt($('.num-questions').val(), 10);
    if (isNaN(numQuestions) || numQuestions <= 0) {
      this.$('.num-questions-error').show();
      return;
    }

    this.$('.num-questions-error').hide();

    var $currentTarget = $(event.currentTarget);
    var curNumQuestions = $currentTarget.siblings('.questions-form').find('.question').length;

    // if number of parts has increased, add the difference
    for (var i = curNumQuestions; i < numQuestions; i++) {
      $currentTarget.siblings('.questions-form').append(this.templates.questionFormTemplate({
        questionNum: i + 1,
      }));
    }

    // if number of questions has decreased, remove the difference
    for (var i = curNumQuestions; i > numQuestions; i--) {
      $currentTarget.siblings('.questions-form').find('.question').last().remove();
    }
  },

  getNumParts: function(event) {
    var $currentTarget = $(event.currentTarget);

    var numParts = parseInt($currentTarget.val(), 10);
    if (isNaN(numParts) || numParts <= 0) {
      $currentTarget.siblings('.num-parts-error').show();
      return;
    }

    $currentTarget.siblings('.num-parts-error').hide();
    var curNumParts = $currentTarget.siblings('.parts-form').find('.part').length;

    // if number of parts has increased, add the difference
    for (var i = curNumParts; i < numParts; i++) {
      $currentTarget.siblings('.parts-form').append(this.templates.partFormTemplate({
        partNum: i + 1,
        isExam: this.isExam
      }));
    }

    // if number of parts has decreased, remove the difference
    for (var i = curNumParts; i > numParts; i--) {
      $currentTarget.siblings('.parts-form').find('.part').last().remove();
    }
  },

  validatePoints: _.debounce(function(event) {
    var $currentTarget = $(event.currentTarget);

    var points = parseFloat($currentTarget.val());
    if (isNaN(points) || points <= 0) {
      $currentTarget.siblings('.points-error').show();
    } else {
      $currentTarget.siblings('.points-error').hide();
    }
  }, 500),

  validateFields: function() {
    var passedValidation = true;

    // validate that a name is entered
    if (this.$('#id_name').val()) {
      this.$('.name-error').hide();
    } else {
      this.$('.name-error').show();
      passedValidation = false;
    }

    // if exam, validate that an exam PDF has been uploaded
    if (this.isExam) {
      if ($('#id_exam_file').val() || this.assessment) {
        this.$('.exam-file-error').hide();
      } else {
        this.$('.exam-file-error').show();
        passedValidation = false;
      }
    }

    // else if homework, validate that a submission deadline is entered
    else {
      if (this.$('#id_submission_deadline').val()) {
        this.$('.submission-error').hide();
      } else {
        this.$('.submission-error').show();
        passedValidation = false;
      }
    }

    // validate that there a number of questions has been entered
    if (this.$('.num-questions').val()) {
      this.$('.num-questions-error').hide();
    } else {
      this.$('.num-questions-error').show();
      passedValidation = false;
    }

    // validate that the user entered a valid response for input asking number
    // of parts for each question
    var $numPartsInputs = this.$('.num-parts');
    for (var i = 0; i < $numPartsInputs.length; i++) {
      var $input = $numPartsInputs.eq(i);
      if ($input.val()) {
        $input.siblings('.num-parts-error').hide();
      } else {
        $input.siblings('.num-parts-error').show();
        passedValidation = false;
      }
    }

    return passedValidation;
  },

  submit: function() {
    var passedValidation = this.validateFields();
    if (!passedValidation) {
      return;
    }

    // now, add the points in JSON representation to the hidden input field
    var assessmentInfo = [];
    var $questions = this.$('.question');

    // iterate over questions
    for (var i = 0; i < $questions.length; i++) {
      var questionNum = i + 1;
      var $points = $questions.eq(i).find('.points');
      var $pages = $questions.eq(i).find('.pages');
      var questionPartInfo = [];

      // iterate over parts
      for (var j = 0; j < $points.length; j++) {
        var partNum = j + 1;
        var points = parseFloat($points.eq(j).val());

        if (isNaN(points) || points < 0) {
          return;
        }

        // add values to the part array
        if (this.isExam) {
          var pagesStr = $pages.eq(j).val();
          var pages = this.getPages(pagesStr);
          if (pages) {
            questionPartInfo.push([points, pagesStr])
          }
        } else {
          questionPartInfo.push(points);
        }
      }

      // add part array to the overall array
      assessmentInfo.push(questionPartInfo);
    }

    this.$('#id_question_part_points').val(JSON.stringify(assessmentInfo));
    this.$('form').submit();
  },

  getPages: function(pages) {
    // Convert CSV of pages to array of integers. First we get rid of the
    // whitespeaces. Then we split them from the commas, so that '1,2,3'
    // will now be ['1', '2', '3']
    // Using the map function, these are then converted to integers to finally
    // get [1,2,3]
    pages = pages.replace(' ', '').split(',').map(function(page) {
      return parseInt(page, 10);
    });

    // Ensure that all of the pages are valid integers. If not, return nothing.
    for (var i = 0; i < pages.length; i++) {
      if (isNaN(pages[i])) {
        return;
      }
    }

    return pages;
  },

  populateFields: function() {
    // if the exam PDF field is not filled for the exam, continue refreshing
    // TODO: improve the UX while the file is being uploaded to AWS
    if (this.isExam && !this.assessment.get('examPdf')) {
      var self = this;
      window.setTimeout(function() {
        location.reload();
      }, 1000);
      return;
    }

    this.isExam = this.assessment.get('isExam');

    // if is exam, change the fields shown
    if (this.isExam) {
      this.$('#id_assessment_type_1').click();
      this.showExamFields();
    }

    // hide the homework/exam type radio buttons; the assessment type cannot
    // be changed after creation
    this.$('.assessment-type-radio').hide();

    // populate name field
    this.$('#id_name').val(this.assessment.get('name'));

    // select correct update the grade up/down option; change to grade down (up
    // is default)
    if (!this.assessment.get('gradeDown')) {
      this.$('#id_grade_type_1').prop('checked', true);
    }

    // populate remaining static form fields
    if (this.isExam) {
      this.$('.exam-file-help .exam-pdf').attr('href', this.assessment.get('examPdf'));
      this.$('.exam-file-help').show();
    } else {
      this.$('#id_submission_deadline').val(this.assessment.get('submissionDeadline'));
    }

    if (this.assessment.get('solutionsPdf')) {
      this.$('.solutions-file-help .solutions-pdf').attr('href', this.assessment.get('solutionsPdf'));
      this.$('.solutions-file-help').show();
    }

    // populate the dynamic form fields (question part info)
    // first, populate the `questionPartInfo` array that contains information
    // about the points (and pages, if `isExam`), grouped by parts
    // ex: [[5, 10], [5]] is an assessment that has two parts for question 1,
    // worth 5 points and 10 points, and one part for question 2 worth 5 points
    var questionPartInfo = [];
    var partsInfo = [];
    var questionNum = 1;
    var partNum = 1;
    var self = this;
    this.questionParts.forEach(function(questionPart) {
      // new question has been added, so add parts of previous question
      if (questionPart.get('questionNumber') > questionNum) {
        questionPartInfo.push(partsInfo);
        questionNum += 1;
        partsInfo = [];
      }

      // add part
      if (self.isExam) {
        partsInfo.push([questionPart.get('maxPoints'), questionPart.get('pages')]);
      } else {
        partsInfo.push(questionPart.get('maxPoints'));
      }

      // if final question part, need to add the part info
      if (self.questionParts.last() === questionPart) {
        questionPartInfo.push(partsInfo);
      }
    });

    $('.num-questions').val(questionPartInfo.length);

    for (var i = 0; i < questionPartInfo.length; i++) {
      var partsInfo = questionPartInfo[i];
      var $question = $(this.templates.questionFormTemplate({questionNum: i + 1 }));
      $question.find('.num-parts').val(partsInfo.length);

      for (var j = 0; j < partsInfo.length; j++) {
        var $part = $(self.templates.partFormTemplate({
          partNum: j + 1,
          isExam: self.isExam
        }));

        if (this.isExam) {
          $part.find('.points').val(partsInfo[j][0]);
          $part.find('.pages').val(partsInfo[j][1]);
        } else {
          $part.find('.points').val(partsInfo[j]);
        }

        $question.find('.parts-form').append($part);
      }
      this.$('.questions-form').append($question);
    }
  }
});
