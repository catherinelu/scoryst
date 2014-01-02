// TODO: browserify
var StudentNavView = Backbone.View.extend({
  /* How long to display the nav success icon. */
  NAV_SUCCESS_DISPLAY_DURATION: 1000,

  /* Key codes for keyboard shorcuts. */
  UP_ARROW_KEY_CODE: 38,
  DOWN_ARROW_KEY_CODE: 40,

  // TODO: comments
  initialize: function(options) {
    var $nextStudent = this.$('.next-student');

    // if the next student button exists, then we can navigate through
    // students; otherwise, navigation should be disabled
    if ($nextStudent.length > 0) {
      // attach events from elements outside this view
      $(window).keydown(_.bind(this.handleShortcuts, this));
      $nextStudent.click(_.bind(this.goToNextStudent, this));
      this.$('.previous-student').click(_.bind(this.goToPreviousStudent, this));
    }
  },

  showNavSuccess: function() {
    // show success icon and then hide it
    var $navSuccessIcon = this.$('.nav-success');
    $navSuccessIcon.show();

    clearTimeout(this.successTimeout);
    this.successTimeout = setTimeout(function() {
      $navSuccessIcon.hide();
    }, this.NAV_SUCCESS_DISPLAY_DURATION);
  },

  /* Goes to the next student if goToNext is true. Otherwise, goes to the
   * previous student. */
  goToStudent: function(goToNext) {
    var self = this;

    $.ajax({
      type: 'GET',
      url: goToNext ? 'get-next-student/' : 'get-previous-student/',

      dataType: 'json',
      success: function(data) {
        var studentPath = data.student_path;
        if (studentPath === window.location.pathname) {
          // no next/previous student
          return;
        }

        // update URL with history API; fall back to standard redirect
        if (window.history) {
          window.history.pushState(null, null, studentPath);

          // trigger AJAX requests for the new student
          Mediator.trigger('resetQuestionPart');
        } else {
          window.location.pathname = studentPath;
        }

        self.showNavSuccess();
      },

      error: function() {
        // TODO: handle error
      }
    });
  },

  /* Navigates to the next student. */
  goToNextStudent: function() {
    this.goToStudent(true);
  },

  /* Navigates to the previous student. */
  goToPreviousStudent: function() {
    this.goToStudent(false);
  },

  handleShortcuts: function(event) {
    // ignore keys entered in an input/textarea
    var $target = $(event.target);
    if ($target.is('input') || $target.is('textarea')) {
      return;
    }

    switch (event.keyCode) {
      case this.UP_ARROW_KEY_CODE:
        event.preventDefault();
        this.goToNextStudent();
        break;

      case this.DOWN_ARROW_KEY_CODE:
        event.preventDefault();
        this.goToPreviousStudent();
        break;
    }
  }
});
