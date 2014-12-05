var MainView = IdempotentView.extend({
  template: _.template($('.assessment-pill-template').html()),

  events: {
    'click a.assessment': 'changeAssessment'
  },

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.assessments = new AssessmentCollection();
    this.$assessmentOptions = $('.assessment-options');
    this.addMediatorListeners();

    var self = this;

    this.assessments.fetch({
      success: function() {
        var $assessmentNav = $('.assessment-nav');
        var assessments = self.assessments.toJSON();
        self.course = assessments[0].course;

        // Filter those assessments that have submissions and find the last one
        var assessmentsWithSubmissions = assessments.filter(function(assessment) {
          return assessment.hasSubmissions;
        });

        var assessmentToShowId;
        if (assessmentsWithSubmissions.length > 0) {
          assessmentToShowId = assessmentsWithSubmissions[assessmentsWithSubmissions.length - 1].id;
        } else {
          // If no assessments have submissions, just show the last assessment
          assessmentToShowId = assessments[assessments.length - 1].id;
        }

        if (window.localStorage) {
          var lastSeenAssessment = 'course' + self.course;
          if (localStorage.getItem(lastSeenAssessment)) {
            assessmentToShowId = localStorage.getItem(lastSeenAssessment);
          }
        }

        assessments.forEach(function(assessment, index) {
          var templateData = {
            assessment: assessment,
            indexOflastAssessmentWithSubmissions: assessment.id == assessmentToShowId
          };
          $assessmentNav.append(self.template(templateData));
        });

        // By default, we show the last assessment
        var assessmentID = assessmentToShowId;
        self.renderStudentsNav(assessmentID);
        self.updateAssessmentOptions(assessmentID);
      }
    });
  },

  changeAssessment: function(event) {
    event.preventDefault();
    var $target = $(event.currentTarget);
    var assessmentID = $target.data('assessment-id');
    this.$assessmentOptions.hide();

    $target.parents('ul').children('li').removeClass('active');
    // Remove any previous views
    this.deregisterSubview();
    this.renderStudentsNav(assessmentID);
    this.updateAssessmentOptions(assessmentID);
    $target.parents('li').addClass('active');

    $('.success').hide();

    if (window.localStorage) {
      var lastSeenAssessment = 'course' + this.course;
      localStorage.setItem(lastSeenAssessment, assessmentID);
    }
  },

  renderStudentsNav: function(assessmentID) {
    var studentsNavView = new StudentsNavView({ el: this.$('.students') });
    studentsNavView.render(assessmentID);

    this.registerSubview(studentsNavView);
  },

  addMediatorListeners: function() {
    var self = this;
    this.listenTo(Mediator, 'assessmentsExist', function() {
      self.$assessmentOptions.show();
    });
  },

  updateAssessmentOptions: function(assessmentID) {
    // Update export assessment link
    $('.export-csv').attr('href', 'csv/' + assessmentID + '/');

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
