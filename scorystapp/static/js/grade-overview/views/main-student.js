var MainView = IdempotentView.extend({
  template: _.template($('.exam-pill-template').html()),

  events: {
    'click a.exam': 'changeExam',
  },

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.exams = new ExamCollection();
    this.courseUser = new CourseUserSelfModel();

    this.studentSummaryView = new StudentSummaryView({ el: '.student-summary' });
    this.registerSubview(this.studentSummaryView);

    var self = this;

    this.exams.fetch({
      success: function() {
        var $examNav = $('.exam-nav');
        exams = self.exams.toJSON();
        exams.forEach(function(exam, index) {
          var templateData = {
            exam: exam,
            last: index == self.exams.length - 1
          }
          $examNav.append(self.template(templateData));
        });

        // By default, we show the last exam
        var examID = exams[exams.length - 1].id;
        self.renderStudentSummary(examID);
      }
    });
  },

  changeExam: function(event) {
    event.preventDefault();
    var $target = $(event.target);
    var examID = $target.data('exam-id');

    $target.parents('ul').children('li').removeClass('active');
    this.renderStudentSummary(examID);
    $target.parents('li').addClass('active');
  },

  renderStudentSummary: function(examID) {
    this.courseUser.setExam(examID);

    var self = this;
    self.courseUser.fetch({
      success: function() {
        self.studentSummaryView.render(examID, self.courseUser.toJSON());
      },
      error: function() {
        // TODO: Log error message.
      }
    });
  },
});

$(function() {
  var mainView = new MainView({ el: $('.grade-overview') });
});
