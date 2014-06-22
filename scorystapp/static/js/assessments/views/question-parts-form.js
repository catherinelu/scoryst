var QuestionPartsFormView = IdempotentView.extend({
  events: {
    'keydown .num-parts': 'getNumParts',
    'keydown .num-questions': 'getNumQuestions',
    'click .next-question': 'goToNextQuestion',
    'click .submit-num-questions': 'submitNumQuestions'
  },

  templates: {
    questionFormTemplate: _.template($('.question-form-template').html()),
    partFormTemplate: _.template($('.part-form-template').html())
  },

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);

    this.numQuestions = null;
    this.curQuestionNum = null;

    this.questionParts = new QuestionPartCollection();
    var self = this;
    this.questionParts.fetch({
      success: function() {
        if (self.questionParts.length > 0) {

        }
      },

      error: function() {
        // TODO: log error message
      }
    })
  },

  getNumQuestions: _.debounce(function(event) {
    this.$('.submit-num-questions').show();
  }, 500),

  getNumParts: _.debounce(function(event) {
    this.numParts = parseFloat($('.num-parts').val(), 10);

    this.$('.all-parts').html('');
    for (var i = 0; i < this.numParts; i++) {
      this.$('.all-parts').append(this.templates.partFormTemplate({ partNum: i + 1 }));
    }

    this.$('.next-question').show();
  }, 500),

  submitNumQuestions: function() {
    this.numQuestions = parseFloat($('.num-questions').val(), 10);
    console.log(this.numQuestions);
    if (isNaN(this.numQuestions)) {
      this.$('.error').show();
      return;
    }

    this.curQuestionNum = 1;
    this.$('.well').html(this.templates.questionFormTemplate({
      questionNum: this.curQuestionNum,
      buttonText: this.curQuestionNum === this.numQuestions ? 'Finish' : 'Proceed'
    }));
  },

  goToNextQuestion: function() {
    // first, validate and save question parts
    var $partInputs = this.$('.part');
    var success = true;
    var allPoints = [];

    for (var i = 0; i < $partInputs.length; i++) {
      var $part = $partInputs.eq(i)
      var points = parseInt($part.find('input').val(), 10);
      if (isNaN(points)) {
        $part.find('.error').show();
        success = false;
      } else {
        $part.find('.error').hide();
        allPoints.push(points);
      }
    }

    if (success) {
      for (var i = 0; i < allPoints.length; i++) {
        console.log('New model');
        var questionPart = new QuestionPartModel({
          questionNumber: this.curQuestionNum,
          partNumber: i + 1,
          maxPoints: allPoints[i],
          assessment: this.model
        });

        this.questionParts.add(questionPart);
        questionPart.save();
      }
    }

    if (this.curQuestionNum < this.numQuestions) {
      this.curQuestionNum += 1;
      this.$('.well').html(this.templates.questionFormTemplate({
        questionNum: this.curQuestionNum,
        buttonText: this.curQuestionNum === this.numQuestions ? 'Finish' : 'Proceed'
      }));
    }
  }

});
