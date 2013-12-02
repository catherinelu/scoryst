Meteor.startup(function() {
  StudentSchema = expects('schema', {
    email: expects('email'),
    profile: expects('schema', {
      firstName: expects('length', 1, 100),
      lastName: expects('length', 1, 100),
      studentId: expects(Number, 'present'),
      type: expects(String, 'choice', ['admin', 'ta', 'student'])
    })
  });
});
