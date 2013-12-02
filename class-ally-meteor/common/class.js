Meteor.startup(function() {
  // TODO: change to course
  Class = new CollectionSchema('class', expects('schema', {
    name: expects('length', 1, 50),
    term: expects(String, 'choice', ['fall', 'winter', 'spring', 'summer']),
    year: expects('range', 2000, 3000),
    students: expects('each', expects('range', 1, 100))
  }));

  // TODO: remove later
  // if (Class.find({ name: 'CS144' }).count() === 0) {
  //   Class.insertConstrained({
  //     name: 'CS144',
  //     term: 'fall',
  //     year: new Date().getFullYear(),
  //     students: []
  //   });
  // }
});
