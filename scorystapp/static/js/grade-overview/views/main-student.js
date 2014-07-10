var MainView = IdempotentView.extend({
  template: _.template($('.assessment-pill-template').html()),

  events: {
    'change .select-assessment select': 'changeAssessment'
  },

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);
    this.assessments = new AssessmentCollection();
    this.courseUser = new CourseUserSelfModel();

    this.studentSummaryView = new StudentSummaryView({ el: '.student-summary' });
    this.registerSubview(this.studentSummaryView);

    var self = this;

    this.assessments.fetch({
      success: function() {
        var $selectAssessment = $('.select-assessment select');
        assessments = self.assessments.toJSON();

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
          $selectAssessment.append(self.template(templateData));
        });

        // By default, we show the last assessment
        var assessmentID = assessments[assessments.length - 1].id;
        self.renderStudentSummary(assessmentID);
      }
    });
  },

  changeAssessment: function(event) {
    event.preventDefault();
    var $select = $(event.currentTarget);
    this.renderStudentSummary($select.val());
  },

  renderStudentSummary: function(assessmentID) {
    this.courseUser.setAssessment(assessmentID);

    var self = this;
    self.courseUser.fetch({
      success: function() {
        self.studentSummaryView.render(assessmentID, self.courseUser.toJSON());
      }
    });
  }
});

$(function() {
  var mainView = new MainView({ el: $('.grade-overview') });
});
