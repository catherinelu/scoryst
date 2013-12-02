Template.dashboard.students = function() {
  // TODO: fix later
  var activeClass = Class.findOne({ name: 'CS144' });

  if (!activeClass || !activeClass.students) {
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

    lines.split('\n').forEach(function(line) {
      var parts = line.split(',');

      var studentFields = {
        email: parts[2],
        profile: {
          firstName: parts[0],
          lastName: parts[1],
          studentID: parseInt(parts[3], 10),
          type: type
        }
      };

      var errors = StudentSchema.run(studentFields);
      if (errors) {
        // TODO: notify user
        console.log('errors', errors);
        return;
      }

      // TODO: fix later
      var activeClass = Class.findOne({ name: 'CS144' });
      Meteor.call('createStudentForClass', studentFields, activeClass,
        function(error) { 
          if (error) {
            console.log('server error', error);
          }
        });
    });
  }
});
