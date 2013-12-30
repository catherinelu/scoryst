var GradedRubricModel = require('./graded-rubric-model.js');

module.exports = Backbone.View.extend({
  /* How long to display the comment success icon. */
  COMMENT_SUCCESS_DISPLAY_DURATION: 1000,

  template: Handlebars.compile($('.rubrics-nav-template').html()),
  events: {
    'click .comment-save': 'saveComment',
    'click .comment-edit': 'editComment',
    'click .fa-trash-o': 'deleteComment',
    'click li': 'toggleRubric'
  },

  /* Initializes this view. Must be given a DOM element container and
   * a QuestionPart model. */
  initialize: function() {
    this.$commentTextarea = $('.comment-textarea');
    this.$commentSuccessIcon = $('.comment-success');
    this.listenTo(this.model, 'change', this.render);
  },

  /* Renders the rubrics navigation. */
  render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    return this;
  },

  /* Saves the comment the user has entered for the custom points field. */
  saveComment: function(event) {
    var comment = this.$commentTextarea.val();

    if (comment !== '') {
      this.model.set('grader_comments', this.$commentTextarea);
      this.model.save({}, {
        success: function() {
          // TODO: this variable?
          // TODO: notify user saving was successful
          console.log('Done!');
          this.showCommentSuccess();
          this.$commentSuccessIcon.show();
        },

        error: function() {
          // TODO: error handler
        }
      });
    } else {
      // TODO: error message
    }
  },

  /* Deletes the comment the user entered for the custom points field. */
  deleteComment: function() {
    this.model.unset('grader_comments');
    this.model.save();
  },

  /* Shows the comment success icon briefly, and then hides it. */
  showCommentSuccess: function() {
    this.$commentSuccessIcon.show();
    setTimeout(function() {
      this.$commentSuccessIcon.hide();
    }, this.COMMENT_SUCCESS_DISPLAY_DURATION);
  }
});
