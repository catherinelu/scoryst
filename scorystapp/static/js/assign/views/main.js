// TODO: browserify
var MainView = IdempotentView.extend({
  template: _.template(this.$('.typeahead-template').html()),

  initialize: function(options) {
    this.constructor.__super__.initialize.apply(this, arguments);

    this.$typeahead = this.$('.typeahead');
    this.addMediatorListeners();

    var self = this;

    this.students = new StudentCollection();
    this.students.fetch({
      success: function() {
        self.students = self.students.toJSON();

        self.initTypeAhead();
        self.renderSubmissionsNav();
      }
    });
  },

  // Initializes the typeahead search to autocomplete when the user is trying to
  // assign an exam to a student.
  initTypeAhead: function() {
    var self = this;
    // Expected format of each element in array:
    // {
    //   'name': 'Karanveer Mohan',
    //   'email': 'kvmohan@stanford.edu',
    //   'studentId': 01234567,
    //   'id': 1,
    //   'tokens': ['Karanveer', 'Mohan'],
    //   'isAssigned': true
    // }
    this.$typeahead.typeahead({
      local: self.students,
      template: this.template,
      limit: 6,
      valueKey: 'name'
    }).on('typeahead:selected', function (obj, student) {
      self.assignSubmissionToStudent(student);
    });

    // Hacky ways of adding dropdown-show class to the typeahead input when
    // the dropdown is being shown and hiding it otherwise.
    this.$typeahead.on('change keyup paste focus', function() {
      if (self.$('.tt-dropdown-menu').is(':visible')) {
        self.$typeahead.addClass('show-dropdown');
      } else {
        self.$typeahead.removeClass('show-dropdown');
      }
    });

    this.$typeahead.blur(function() {
      self.$typeahead.removeClass('show-dropdown');
    });
  },

  // When the user clicks on an assigned submission, show the student's name in
  // the typeahead input box.
  addMediatorListeners: function() {
    var self = this;
    this.listenTo(Mediator, 'changeSubmissionName', function(name) {
      self.$typeahead.typeahead('setQuery', name).focus();
    });
  },

  renderSubmissionsNav: function() {
    this.submissionsNavView = new SubmissionsNavView({ el: this.$('.submissions-nav') });
    this.registerSubview(this.submissionsNavView);
  },

  // Assign the submission on the right hand side to the student inputted by the user
  assignSubmissionToStudent: function(assignedStudent) {
    // Suppose the current submission was assigned to student X, and now is assigned
    // to student Y. submissionsNavView.assignSubmissionToStudent will return the Id of student X
    // so that we can update student X's 'isAssigned' field to false so that it
    // won't say 'assigned' in the typeahead search.
    var unassignedId = this.submissionsNavView.assignSubmissionToStudent(assignedStudent.id);

    this.students.forEach(function(student) {
      if (student.id == assignedStudent.id) {
        student.isAssigned = true;
      } else if (student.id == unassignedId) {
        student.isAssigned = false;
      }
    });
  }
});

$(function() {
  new MainView({ el: $('.assign-exams') });
});
