Meteor.startup(function() {
  Class = new Meteor.Collection2('class', {
    schema: {
      name: {
        type: String,
        label: 'Name',
        min: 1,
        max: 50
      },

      term: {
        type: String,
        allowedValues: ['fall', 'winter', 'spring', 'summer']
      },

      year: {
        type: Number,
        min: 2000,
        max: 3000
      }//,

      // TODO: array validation doesn't work for some reason
      // students: {
      //   type: [String],
      //   minCount: 0,
      //   optional: true
      // }
    }
  });

  // TODO: remove later
  if (Class.find({ name: 'CS144' }).count() === 0) {
    Class.insert({
      name: 'CS144',
      term: 'fall',
      year: new Date().getFullYear(),
      students: []
    }, function(error) {
      var schema = Class.simpleSchema();
      console.log(arguments, error instanceof Match.Error);
    });
  }
});
