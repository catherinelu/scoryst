var MainView = IdempotentView.extend({
  template: _.template($('.assessment-pill-template').html()),

  events: {
    'change .select-assessment select': 'changeAssessment'
  },

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.assessments = new AssessmentCollection();
    this.$assessmentOptions = $('.assessment-options');
    this.addMediatorListeners();

    var self = this;

    this.assessments.fetch({
      success: function() {
        var $assessmentSelect = $('.select-assessment select');
        var assessments = self.assessments.toJSON();

        // Filter those assessments that have submissions and find the last one
        var assessmentsWithSubmissions = assessments.filter(function(assessment) {
          return assessment.hasSubmissions;
        });

        var indexOflastAssessmentWithSubmissions = assessmentsWithSubmissions.length - 1;

        // If no assessments have submissions, just show the last assessment
        if (indexOflastAssessmentWithSubmissions === -1) {
          indexOflastAssessmentWithSubmissions = assessments.length - 1;
        }

        assessments.forEach(function(assessment, index) {
          var templateData = {
            assessment: assessment,
            indexOflastAssessmentWithSubmissions: index == indexOflastAssessmentWithSubmissions
          };
          $assessmentSelect.append(self.template(templateData));
        });

        // By default, we show the last assessment
        var assessmentID = assessments[indexOflastAssessmentWithSubmissions].id;
        self.renderStudentsNav(assessmentID);
        self.updateAssessmentOptions(assessmentID);
      }
    });
  },

  changeAssessment: function(event) {
    var $select = $(event.target);
    var assessmentID = $select.val();
    this.$assessmentOptions.hide();

    // Remove any previous views
    this.deregisterSubview();
    this.renderStudentsNav(assessmentID);
    this.updateAssessmentOptions(assessmentID);
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
