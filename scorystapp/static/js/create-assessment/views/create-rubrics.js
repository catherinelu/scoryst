var CreateRubricsView = IdempotentView.extend({
  events: {
    'click .add-rubric': 'addRubric',
    'change input[name=grade-down]': 'changeGrading',
    'click .done-rubric': 'save'
  },

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);

    this.gradeDown = true;
    this.$gradeDownRadio = $('input[name=grade-down]');

    var self = this;
    this.model.on('invalid', function(model, error) {
      self.$el.find('.question-part-points-error').html(error);
    });

    this.fetchRubrics();
    this.initializePopover();
  },

  deregisterSubview: function(view) {
    // removes the rubrics
    var self = this;
    _.each(this.subviews, function(subview) {
      subview.remove();
    });

    this.constructor.__super__.initialize.apply(this, arguments);
  },

  fetchRubrics: function() {
    this.rubrics = new RubricCollection({}, {
      questionPart: this.model
    });

    // do not fetch rubrics if the question part is not yet saved
    if (this.model.isNew()) {
      return;
    }

    var self = this;
    this.rubrics.fetch({
      success: function() {
        // create a view for each rubric
        self.rubrics.each(function(rubric) {
          self.createNewRubricView(rubric);
        });
      },

      error: function() {
        // TODO: handle error
      }
    });
  },

  initializePopover: function() {
    var infoPopoverText = 'Exams can be graded down or up. If grading down, exams' +
      ' have perfect scores initially, and each rubric selected deducts points from' +
      ' the total score. If grading up, exams have 0 points awarded initially, and' +
      ' each rubric selected awards points to the total score.';
    var $infoPopover = $('.info-popover');
    $infoPopover.popover({ content: infoPopoverText, placement: 'right' });
  },

  addRubric: function() {
    var rubricModel = new RubricModel({
      questionPart: this.model.id,
      description: null,
      points: null,
      awardedOrDeducted: (this.model.attributes['gradeDown'] ? 'deducted' : 'awarded')
    });
    this.rubrics.add(rubricModel);

    this.createNewRubricView(rubricModel);
  },

  createNewRubricView: function(rubric) {
    var rubricView = new RubricView({
      questionPart: this.model,
      model: rubric
    });

    this.registerSubview(rubricView);
    this.$('.rubrics').append(rubricView.render().$el);
  },

  changeGrading: function() {
    this.gradeDown = this.$gradeDownRadio.filter(':checked').val() == 'yes';

    var $awardedOrDeducted = $('.awarded-or-deducted');
    if (this.gradeDown) {
      $awardedOrDeducted.html('deducted');
    } else {
      $awardedOrDeducted.html('awarded');
    }
  },

  save: function() {
    // save the question part
    var maxPoints = parseInt(this.$('.max-points').val(), 10);
    var self = this;
    console.log('saving question part');
    this.model.save({
      maxPoints: maxPoints,
      assessment: 75
    },
    {
      wait: true,

      success: function() {
        t = self.model;
        console.log('save was successful');
        self.$('.question-part-points-error').html('');
        // save each of the rubrics
        var saved = true;
        _.each(self.subviews, function(subview) {
          var rubricSaved = subview.save();
          saved = rubricSaved && saved;
        });

        return saved;
      },

      error: function(model, error) {  // TODO: seems unnecessary - delete
        console.log('saving question part failed with error: ' + error);
        return false;
      }
    });
    f = this.model;
  }
});
