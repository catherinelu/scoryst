// TODO: browserify
var RubricView = IdempotentView.extend({
  tagName: 'li',
  template: Handlebars.compile($('.rubric-template').html()),

  events: {
    'click': 'toggle',
    'click .edit': 'edit',
    'click .save': 'save'
  },

  /* Initializes this rubric. Requires a Rubric model and the following options:
   * questionPartAnswer -- the QuestionPartAnswer model of the current student
   *  being graded
   */
  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.questionPartAnswer = options.questionPartAnswer;

    this.editing = false;
    this.enableToggle = true;

    this.listenTo(this.model, 'change', this.render);
    this.listenTo(this.questionPartAnswer, 'change:rubrics', this.render);

    this.listenTo(Mediator, 'enableEditing', this.enableEditing);
    this.listenTo(Mediator, 'disableEditing', this.disableEditing);
  },

  /* Renders this rubric in a new li element. */
  render: function() {
    var rubric = this.model.toJSON();
    var gradeDown = this.questionPartAnswer.get('question_part').grade_down;

    // associate a color (red or green) with each rubric
    if (gradeDown) {
      rubric.color = rubric.points > 0 ? 'red' : 'green';
      // If we are grading down, we want the points to be displayed as negative
      // so if a rubric has 10 points associated, it shows up as -10
      rubric.display_points = -rubric.points;
    } else {
      rubric.color = rubric.points < 0 ? 'red' : 'green';
      rubric.display_points = rubric.points;
    }

    // track whether this rubric is selected
    var selectedRubrics = this.questionPartAnswer.get('rubrics');
    if (_.contains(selectedRubrics, rubric.id)) {
      this.$el.addClass('selected');
    } else {
      this.$el.removeClass('selected');
    }

    rubric.editing = this.editing;
    this.$el.html(this.template(rubric));
    return this;
  },

  /* Don't allow user to toggle rubrics when in editing mode. */
  enableEditing: function(event) {
    console.log('disable toggle');
    this.enableToggle = false;
  },

  disableEditing: function(event) {
    console.log('enable toggle');
    this.enableToggle = true;
  },

  /* Toggles this rubric on/off. */
  toggle: function() {
    if (!this.enableToggle) {
      return;
    }

    // clone rubrics, since we're going to modify them
    var rubrics = _.clone(this.questionPartAnswer.get('rubrics'));
    var rubricId = this.model.get('id');

    if (this.$el.hasClass('selected')) {
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

    // TODO: make graded a computed property
    // update model with new rubrics
    this.questionPartAnswer.save({ rubrics: rubrics }, { wait: true });
  },

  /* Make this rubric editable. */
  edit: function(event) {
    event.preventDefault();
    this.editing = true;
    this.render();
  },

  /* Save the edits made to this rubric. */
  save: function(event) {
    event.preventDefault();
    var description = this.$('.description').val();
    var points = parseFloat(this.$('.rubric-points').val(), 10);

    // use the correct sign if the exam is graded down
    var gradeDown = this.questionPartAnswer.get('question_part').grade_down;
    if (gradeDown) {
      points = -points;
    }

    this.editing = false;
    this.model.save({
      description: description,
      points: points
    }, { wait: true });
  }
});
