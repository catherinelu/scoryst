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

  editComment: function(event) {
    this.$('.comment-save').removeClass('hidden');
    this.$('.comment-edit').addClass('hidden');
    this.$('.comment-textarea').removeAttr('disabled');
  },

  /* Saves the comment the user has entered for the custom points field. */
  saveComment: function(event) {
    var comment = this.$('.comment-textarea').val();
    if (!comment) return;
    var self = this;

    this.model.save({ grader_comments: comment }, {
      success: function() {
        self.showCommentSuccess();
        self.$('.comment-save').addClass('hidden');
        self.$('.comment-edit').removeClass('hidden');
        self.$('.comment-textarea').val(comment);
        self.$('.comment-textarea').attr('disabled', 'disabled');
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
    this.$('.comment-save').removeClass('hidden');
    this.$('.comment-edit').addClass('hidden');
    this.$('.comment-textarea').removeAttr('disabled');
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
