var CourseUsersListView = Backbone.View.extend({
  templates: {
    rosterTemplate: Handlebars.compile($('.roster-template').html()),
    editRosterTemplate: Handlebars.compile($('.edit-roster-template').html()),
  },
  events: {
    'click a.save': 'saveRoster',
    'click a.edit': 'editRoster'
  },

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.courseUsers = new CourseUserCollection();

    // Re-render when any of the course users change.
    this.listenTo(this.courseUsers, 'change', this.render);

    var self = this;
    this.courseUsers.fetch({
      success: function() {
        self.render();
        // Changes height of roster to fill the screen.
        self.resizeRosterList();
      },

      error: function() {
        // TODO: Log error message.
      }
    });
  },

  render: function() {
    $('table tbody').html(this.templates.rosterTemplate({
      'courseUsers': this.courseUsers.toJSON()
    }));
  },

  editRoster: function(event) {
    var $tr = $(event.currentTarget).parents('tr');
    var $tds = $tr.children('td');
    $tr.html(this.templates.editRosterTemplate({
      firstName: $tds.eq(0).html(),
      lastName: $tds.eq(1).html(),
      studentId: $tds.eq(2).html(),
      currentlyIsInstructor: $tds.eq(3).html() === 'Instructor',
      currentlyIsTA: $tds.eq(3).html() === 'TA',
      currentlyIsStudent: $tds.eq(3).html() === 'Student'
    }));
  },

  saveRoster: function(event) {
    var $tr = $(event.currentTarget).parents('tr');
    var $tds = $tr.children('td');
    var privilege = $tds.find('select option').filter(':selected').val();
    var courseUser = this.courseUsers.get($tr.attr('data-course-user-id'));

    courseUser.save({
      user: {
        first_name: $tds.eq(0).find('input').val(),
        last_name: $tds.eq(1).find('input').val(),
        student_id: $tds.eq(2).find('input').val()
      },
      privilege: privilege
    });
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
  var courseUsersListView = new CourseUsersListView({
    el: $('.roster-scroll')
  });
});
