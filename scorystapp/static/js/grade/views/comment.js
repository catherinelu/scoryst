// TODO: browserify
var CommentView = IdempotentView.extend({
  /* How long to display the comment success icon. */
  COMMENT_SUCCESS_DISPLAY_DURATION: 1000,

  template: Handlebars.compile($('.comment-template').html()),
  events: {
    'click .comment-save': 'saveComment',
    'click .comment-edit': 'editComment',
    'click .fa-trash-o': 'deleteComment'
  },

  /* Initializes this comment. Requires a QuestionPartAnswer model. */
  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.listenTo(this.model, 'change:grader_comments', this.render);
  },

  render: function() {
    var questionPartAnswer = this.model.toJSON();
    this.$el.html(this.template(questionPartAnswer));
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
  }
});
