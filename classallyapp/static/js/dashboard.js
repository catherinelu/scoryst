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

// TODO: create legitimate form validation library...
Handlebars.registerHelper('error', function(options) {
  var error = Session.get('errors');
  var parts = options.hash['for'];

  parts = parts.split('.');
  _(parts).each(function(part) {
    if (error) {
      error = error[part];
    }
  });

  if (error) {
    if (options.fn) {
      var data = _.extend({}, this, { message: error });
      return options.fn(data);
    } else {
      return new Handlebars.SafeString(Template.error({
        field: convertToWordCase(parts[parts.length - 1]),
        message: error
      }));
    }
  }
});

function convertToWordCase(str) {
  var wordCaseStr = '';

  // add initial character in uppercase
  if (str.length > 0) {
    wordCaseStr = str[0].toUpperCase();
  }

  // add subsequent characters in lowercase, inserting spaces when necessary
  for (var i = 1; i < str.length; i++) {
    if (str[i] === str[i].toUpperCase()) {
      wordCaseStr += ' ';
    }

    wordCaseStr += str[i].toLowerCase();
  }

  return wordCaseStr;
}

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
          studentId: parseInt(parts[3], 10),
          type: type
        }
      };

      var errors = StudentSchema.run(studentFields);
      if (errors) {
        Session.set('errors', errors);
        return;
      }

      // unset errors
      Session.set('errors', undefined);

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
