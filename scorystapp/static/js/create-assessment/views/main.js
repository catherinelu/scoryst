var MainView = IdempotentView.extend({
  events: {
    'click .question-num': 'changeQuestionPart',
    'click .part-num': 'changeQuestionPart'
  },

initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);

    this.activeQuestionNumber = options.activeQuestionNumber;
    this.activePartNumber = options.activePartNumber;

    // var assessments = new AssessmentCollection();
    // this.model.fetch({});
    // this.model = this.

    this.questionParts = new QuestionPartCollection();

    var self = this;
    this.questionParts.fetch({
      success: function() {
        self.render();
      },

      error: function() {
        // TODO: handle error
      }
    });
  },

  render: function() {
    var self = this;
    var questionPart = this.questionParts.filter(
    function(questionPart) {
      // find the question part that matches the given active question/part numbers
      return questionPart.questionNumber === self.activeQuestionNumber &&
        questionPart.partNumber === self.activePartNumber;
    })[0];

    // if question part is not yet created, create new (but unsaved) model for it
    if (questionPart === undefined) {
      questionPart = new QuestionPartModel({
        questionNumber: this.activeQuestionNumber,
        partNumber: this.activePartNumber,
        gradeDown: true
      });
      this.questionParts.add(questionPart)
    }

    this.renderRubrics(questionPart);
  },

  renderRubrics: function(questionPart) {
    this.createRubricsView = new CreateRubricsView({
      model: questionPart,
      el: '.add-rubrics'
    });

    this.registerSubview(this.createRubricsView);
  },

  changeQuestionPart: function(event) {
    event.preventDefault();
    var $currentTarget = $(event.currentTarget);

    // update the active class
    $currentTarget.parent('.nav-pills').find('li').removeClass('active');
    $currentTarget.addClass('active');

    // update the internal active question/part numbers
    var questionNum = parseInt($currentTarget.find('a').attr('data-question-num'), 10);
    if (questionNum) {
      this.activeQuestionNumber = questionNum;
    } else {
      var partNum = parseInt($currentTarget.find('a').attr('data-part-num'), 10);
      this.activePartNumber = partNum;
    }

    // save the question part and corresponding rubrics
    if (this.createRubricsView.save(this.activeQuestionNumber, this.activePartNumber)) {
      // update the views
      this.deregisterSubview();
      this.render();
    }
  }
});

$(function() {
  var mainView = new MainView({
    el: $('.container'),  // TODO: add another class?
    activeQuestionNumber: 1,
    activePartNumber: 1
  });
});
