// TODO: browserify
var RubricsNavView = IdempotentView.extend({
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
    this.constructor.__super__.initialize.apply(this, arguments);
    this.rubrics = options.rubrics;

    // re-render whenever model changes
    this.listenTo(this.model, 'change', this.render);
    this.listenToDOM($(window), 'keyup', this.handleShortcuts);
  },

  /* Renders the rubrics navigation. */
  render: function() {
    // include QuestionPartAnswer, QuestionPart, and Rubrics in template data
    var templateData = this.model.toJSON();
    var selectedRubrics = this.model.get('rubrics');

    templateData.rubrics = this.rubrics.toJSON();
    templateData.rubrics.forEach(function(rubric) {
      // mark rubrics as selected
      if (_.contains(selectedRubrics, rubric.id)) {
        rubric.selected = true;
      }

      // associate a color (red or green) with each rubric
      if (templateData.question_part.grade_down) {
        rubric.color = rubric.points > 0 ? 'red' : 'green';
        // If we are grading down, we want the points to be displayed as negative
        // so if a rubric has 10 points associated, it shows up as -10
        rubric.display_points = -rubric.points;
      } else {
        rubric.color = rubric.points < 0 ? 'red' : 'green';
        rubric.display_points = rubric.points;
      }
    });

    templateData.has_custom_points = _.isNumber(templateData.custom_points);
    this.$el.html(this.template(templateData));

    // TODO: browserify
    window.resizeNav();
    return this;
  },

  /* Saves the comment the user has entered for the custom points field. */
  saveComment: function(event) {
    var comment = this.$('.comment-textarea').val();
    var self = this;

    this.model.save({ grader_comments: comment }, {
      success: function() {
        self.showCommentSuccess();
      },

      error: function() {
        // TODO: error handler
      },

      wait: true
    });
  },

  /* Deletes the comment the user entered for the custom points field. */
  deleteComment: function() {
    this.model.save({ grader_comments: null }, { wait: true });
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
    var $target = $(event.target);
    var $customPoints = $rubric.find('input');

    if ($customPoints.length > 0) {
      if ($rubric.hasClass('selected') && !$target.is('input')) {
        // custom points is selected and was just clicked by user; deselect it
        this.model.save({ custom_points: null }, { wait: true });
      } else {
        // custom points is not selected and was just clicked by user; focus input
        $customPoints.focus();
      }
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
      var graded = rubrics.length > 0 || _.isNumber(this.model.get('custom_points'));
      var newModelProperties = {
        rubrics: rubrics,
        graded: graded
      };

      // if this question part was just graded, update the grader
      if (graded) {
        newModelProperties.grader = window.CURRENT_COURSE_USER_ID;
      }

      // view will automatically update when model is changed
      this.model.save(newModelProperties, { wait: true });
    }
  },

  /* Updates the model's custom points field. This function is debounced, so
   * it's only called once the input stops arriving. */
  updateCustomPoints: _.debounce(function(event) {
    var customPoints = parseFloat($(event.currentTarget).val(), 10);
    var newModelProperties;

    // only set a valid number of custom points
    if (!isNaN(customPoints)) {
      newModelProperties = { 
        custom_points: customPoints,
        graded: true
      };
    } else {
      newModelProperties = {
        custom_points: null,
        graded: this.model.get('rubrics').length > 0
      };
    }

    // if this question part was just graded, update the grader
    if (newModelProperties.graded) {
      newModelProperties.grader = window.CURRENT_COURSE_USER_ID;
    }

    this.model.save(newModelProperties, { wait: true });
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
