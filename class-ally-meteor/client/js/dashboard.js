Template.dashboard.students = function() {
  var activeClass = Session.get('activeClass');

  // TODO: remove later
  if (!activeClass) {
    Session.set('activeClass', Class.findOne({ name: 'CS144' }));
    activeClass = Session.get('activeClass');
  }

  if (!activeClass.students) {
    return [];
  } else {
    // fetch all students and return them
    return activeClass.students.map(function(studentId) {
      return Meteor.users.findOne({_id: studentId});
    });
  }
};

Template.dashboard.events({
  'submit .add-people': function(event) {
    event.preventDefault();

    var $form = $(event.target);
    var type = $form.find('[name="type"]:checked').val();
    var lines = $form.find('textarea').val();

    console.log('lines', lines, lines.split('\n'));
    lines.split('\n').forEach(function(line) {
      var parts = line.split(',');
      var validator = StudentSchema.newContext();

      var studentFields = {
        email: parts[2],
        profile: {
          firstName: parts[0],
          lastName: parts[1],
          studentID: parseInt(parts[3], 10),
          type: type
        }
      };

      if (validator.validate(studentFields)) {
        var activeClass = Session.get('activeClass');
        var result = Meteor.call('createStudentForClass', studentFields,
          activeClass._id, activeClass.students);

        if (result !== true) {
          // TODO: handle error
          console.log('error is', result);
        }
      } else {
        // TODO: notify user
        console.log('validation error:', validator.invalidKeys());
      }
    });
  }
});
