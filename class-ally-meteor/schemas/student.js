Meteor.startup(function() {
  StudentSchema = new SimpleSchema({
    email: {
      type: String,
      regEx: SchemaRegEx.Email
    },

    'profile.firstName': {
      type: String,
      min: 1,
      max: 100
    },

    'profile.lastName': {
      type: String,
      min: 1,
      max: 100
    },

    'profile.studentID': {
      type: Number,
      min: 0
    },

    'profile.type': {
      type: String,
      allowedValues: ['Super TA', 'TA', 'Student']
    }
  });
});
