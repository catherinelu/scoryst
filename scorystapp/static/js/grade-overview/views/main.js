var MainView = IdempotentView.extend({
  template: _.template($('.assessment-pill-template').html()),

  events: {
    'click a.assessment': 'changeAssessment',
  },

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.assessments = new AssessmentCollection();

    var self = this;

    this.assessments.fetch({
      success: function() {
        var $assessmentNav = $('.assessment-nav');
        var assessments = self.assessments.toJSON();
        assessments.forEach(function(assessment, index) {
          var templateData = {
            assessment: assessment,
            last: index == self.assessments.length - 1
          }
          $assessmentNav.append(self.template(templateData));
        });

        // By default, we show the last assessment
        var assessmentID = assessments[assessments.length - 1].id;
        self.renderStudentsNav(assessmentID);
        self.updateAssessmentOptions(assessmentID);
      }
    });
  },

  changeAssessment: function(event) {
    event.preventDefault();
    var $target = $(event.target);
    var assessmentID = $target.data('assessment-id');

    $target.parents('ul').children('li').removeClass('active');
    // Remove any previous views
    this.deregisterSubview();
    this.renderStudentsNav(assessmentID);
    $target.parents('li').addClass('active');

    this.updateAssessmentOptions(assessmentID);
  },

  renderStudentsNav: function(assessmentID) {
    var studentsNavView = new StudentsNavView({ el: this.$('.students') });
    studentsNavView.render(assessmentID);
    this.registerSubview(studentsNavView);
  },

  updateAssessmentOptions: function(assessmentID) {
    // Update export assessment link
    $('.export-csv').attr('href', assessmentID + '/csv/');

    if (this.popover) {
      this.popover.unbindPopoverConfirm();
    }

    // Create release popover
    this.popover = $('.release-grades').popoverConfirm({
      placement: 'right',
      text: 'Once you release grades, students with graded assessments who have not' +
        ' been previously notified will receive an email and be able to view their scores.',
      confirmText: 'Release',
      confirm: function() {
        $.ajax({
          url: assessmentID + '/release/'
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
