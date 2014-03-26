var MainView = IdempotentView.extend({
  templates: {
    examPillTemplate: _.template($('.exam-pill-template').html()),
  },

  events: {
    'click a.exam': 'changeExam',
  },

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.exams = new ExamCollection();

    var self = this;

    this.exams.fetch({
      success: function() {
        var $examNav = $('.exam-nav');
        exams = self.exams.toJSON();
        exams.forEach(function(exam, index) {

          var templateData = {
            exam: exam,
            // true if the current exam is last in the list. By default,
            // last exam is active
            last: index == self.exams.length - 1
          }
          $examNav.append(self.templates.examPillTemplate(templateData));
        });

        // By default, we show the last exam
        var examID = exams[exams.length - 1].id;
        self.renderStudentsNav(examID);
      },
      error: function() {
        // TODO: Log error message.
      }
    });
  },

  changeExam: function(event) {
    event.preventDefault();
    var $target = $(event.target);
    var examID = $target.data('exam-id');

    $target.parents('ul').children('li').removeClass('active');
    // Remove any previous views
    this.deregisterSubview();
    this.renderStudentsNav(examID);
    $target.parents('li').addClass('active');
  },

  renderStudentsNav: function(examID) {
    var studentsNavView = new StudentsNavView({
      el: this.$('.students'),
      examID: examID
    });
    this.registerSubview(studentsNavView);
  },

});

$(function() {
  var mainView = new MainView({ el: $('.grade-overview') });
});
