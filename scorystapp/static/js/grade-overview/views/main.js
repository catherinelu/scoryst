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
    this.studentsNavView = new StudentsNavView({ el: this.$('.students') });

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
        self.updateExamOptions(examID);
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
    this.renderStudentsNav(examID);
    $target.parents('li').addClass('active');

    this.updateExamOptions(examID);
  },

  renderStudentsNav: function(examID) {
    this.studentsNavView.render(examID);
  },

  updateExamOptions: function(examID) {
    // Update export exam link
    $('.export-csv').attr('href', examID + '/csv/');

    // TODO: There needs to be a better way for me to unbind the events
    // instead of breaking popover modularity and unbinding .delete and .cancel myself.
    $('.release-grades').off();
    $('.delete').off();
    $('.cancel').off();

    // Create release popover
    $('.release-grades').popoverConfirm({
      placement: 'right',
      text: 'Once you release grades, students with graded exams who have not' +
        ' been previously notified will receive an email and be able to view their scores.',
      confirmText: 'Release',
      confirm: function() {
        $.ajax({
          url: examID + '/release/'
        }).done(function() {
          $('.error').hide();
          $('.success').fadeIn();
        }).fail(function() {
          $('.success').hide();
          $('.error').fadeIn();
        });
      }
    });
  }

});

$(function() {
  var mainView = new MainView({ el: $('.grade-overview') });
});
