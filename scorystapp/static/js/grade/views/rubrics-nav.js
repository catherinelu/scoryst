// TODO: browserify
var RubricsNavView = Backbone.View.extend({
  /* How long to display the comment success icon. */
  COMMENT_SUCCESS_DISPLAY_DURATION: 1000,

  /* Key code for keyboard shortcuts. */
  A_KEY_CODE: 65,

  template: Handlebars.compile($('.rubrics-nav-template').html()),
  events: {
    'click .comment-save': 'saveComment',
    'click .comment-edit': 'editComment',
    'click .fa-trash-o': 'deleteComment',
    'click li': 'toggleRubric',
    'keydown .custom-points': 'updateCustomPoints'
  },

  // TODO: comments
  /* Initializes this view. Must be given a DOM element container,
   * a QuestionPartAnswer model, and a list of rubrics. */
  initialize: function(options) {
    this.rubrics = options.rubrics;
    this.questionPart = options.questionPart;

    // re-render whenever model changes
    this.listenTo(this.model, 'change', _.bind(this.render, this));
    $(window).keyup(_.bind(this.handleShortcuts, this));
  },

  /* Updates the model, rubrics, and question part of this view. */
  setOptions: function(options) {
    this.stopListening(this.model);
    this.rubrics = options.rubrics;
    this.questionPart = options.questionPart;

    this.model = options.model;
    this.listenTo(this.model, 'change', _.bind(this.render, this));
    return this;
  },

  /* Renders the rubrics navigation. */
  render: function() {
    // include QuestionPartAnswer, QuestionPart, and Rubrics in template data
    var templateData = this.model.toJSON();
    _.extend(templateData, this.questionPart.toJSON());
    templateData.rubrics = this.rubrics.toJSON();

    var selectedRubrics = this.model.get('rubrics');
    var total_points = 0;

    templateData.rubrics.forEach(function(rubric) {
      // mark rubrics as selected
      if (_.contains(selectedRubrics, rubric.id)) {
        rubric.selected = true;
        total_points += rubric.points;
      }

      // associate a color (red or green) with each rubric
      if (templateData.grade_down) {
        rubric.color = rubric.points > 0 ? 'red' : 'green';
      } else {
        rubric.color = rubric.points < 0 ? 'red' : 'green';
      }
    });

    // compute awarded points
    if (templateData.grade_down) {
      templateData.points = templateData.max_points - total_points;
    } else {
      templateData.points = total_points;
    }

    // TODO: Is this intuitive, or should we add it before doing the if else?
    templateData.points += templateData.custom_points;

    this.$el.html(this.template(templateData));

    // TODO: browserify
    window.resizeNav();
    return this;
  },

  /* Saves the comment the user has entered for the custom points field. */
  saveComment: function(event) {
    var comment = this.$('.comment-textarea').val();
    var self = this;

    this.model.set('grader_comments', comment);
    this.model.save({}, {
      success: function() {
        self.showCommentSuccess();
      },

      error: function() {
        // TODO: error handler
      }
    });
  },

  /* Deletes the comment the user entered for the custom points field. */
  deleteComment: function() {
    this.model.set('grader_comments', null);
    this.model.save();
  },

  /* Shows the comment success icon briefly, and then hides it. */
  showCommentSuccess: function() {
    var $commentSuccessIcon = this.$('.comment-success');
    $commentSuccessIcon.show();

    setTimeout(function() {
      $commentSuccessIcon.hide();
    }, this.COMMENT_SUCCESS_DISPLAY_DURATION);
  },

  // TODO: disable grading for view exam
  /* Toggle the rubric that was clicked. */
  toggleRubric: function(event) {
    var $rubric = $(event.currentTarget);
    var $customPoints = $rubric.find('input');

    if ($customPoints.length > 0) {
      // custom points clicked; ensure input is focused
      $customPoints.focus();
    } else {
      // regular rubric
      var rubricId = parseInt($rubric.attr('data-rubric'), 10);

      // clone rubrics, since we're going to modify them
      var rubrics = _.clone(this.model.get('rubrics'));

      if ($rubric.hasClass('selected')) {
        // user wants to deselect rubric
        rubrics = rubrics.filter(function(rubric) {
          return rubric !== rubricId;
        });
      } else {
        // user wants to select rubric
        if (!_.contains(rubrics, rubricId)) {
          rubrics.push(rubricId);
        }
      }

      // update model with new rubrics
      var graded = rubrics.length > 0 || this.model.get('custom_points');
      this.model.set('rubrics', rubrics);
      this.model.set('graded', graded);

      // if this question part was just graded, update the grader
      if (graded) {
        this.model.set('grader', window.CURRENT_USER_ID);
      }

      // view will automatically update when model is changed
      this.model.save();
    }
  },

  /* Updates the model's custom points field. This function is debounced, so
   * it's only called once the input stops arriving. */
  updateCustomPoints: _.debounce(function(event) {
    var customPoints = parseFloat($(event.currentTarget).val(), 10);

    // only set a valid number of custom points
    if (!isNaN(customPoints)) {
      this.model.set('custom_points', customPoints);
      this.model.set('graded', true);
      this.model.save();
    } else {
      this.model.set('custom_points', null);
      this.model.set('graded', this.model.get('rubrics').length > 0);
      this.model.save();
    }

    // if this question part was just graded, update the grader
    if (this.model.get('graded')) {
      this.model.set('grader', window.CURRENT_USER_ID);
    }
  }, 1000),

  /* Handle A, B, ..., Z keyboard shortcuts for selecting rubrics. */
  handleShortcuts: function(event) {
    // ignore keys entered in an input/textarea
    var $target = $(event.target);
    if ($target.is('input') || $target.is('textarea')) {
      return;
    }

    // trigger click event on the rubric that corresponds to the letter clicked
    var index = event.keyCode - this.A_KEY_CODE;
    this.$('li').eq(index).click();
  }
});
