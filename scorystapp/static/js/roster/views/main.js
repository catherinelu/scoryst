var MainView = IdempotentView.extend({
  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.courseUsers = new CourseUserCollection();

    var self = this;
    var $tbody = $('tbody');
    this.courseUsers.fetch({
      success: function() {
        self.courseUsers.forEach(function(courseUser) {
          $tbody.append('<tr class="course-user-' + courseUser.id + '"></tr>')
          self.renderTableRow(courseUser);
        });
        // Changes height of roster to fill the screen.
        self.resizeRosterList();
      },

      error: function() {
        // TODO: Log error message.
      }
    });
  },

  renderTableRow: function(courseUser) {
    var tableRowView = new TableRowView({
      el: $('.course-user-' + courseUser.id),
      courseUser: courseUser
    });

    this.registerSubview(tableRowView);
  },

  resizeRosterList: function(event) {
    var height = $('.main').height() - this.$el.offset().top -
      parseInt($('.container.roster').css('margin-bottom'), 10);
    if (height > this.$el.height()) {
      this.$el.css({'height': height + 'px'});      
      $('.roster-scroll').customScrollbar();
    }
  }
});

$(function() {
  var mainView = new MainView({
    el: $('.roster-scroll')
  });
});
