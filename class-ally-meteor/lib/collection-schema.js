CollectionSchema = function(name, expectation) {
  this.name = name;
  this.expectation = expectation;
  this.collection = new Meteor.Collection(name);
};

['find', 'findOne', 'insert', 'update', 'upsert', 'remove',
    'allow', 'deny'].forEach(function(method) {
  CollectionSchema.prototype[method] = function() {
    var args = Array.prototype.splice.call(arguments, 0);
    return this.collection[method].apply(this.collection, args);
  };
});

CollectionSchema.prototype.insertConstrained = function(document, callback) {
  var errors = this.expectation.run(document);

  if (errors && callback) {
    callback(errors);
    return;
  } else if (errors) {
    console.log('Errors:', errors);
    throw new Match.Error('collection.insertConstrainted() ' +
      'violated constraints.');
  }

  return this.collection.insert.call(this.collection, document, callback);
};

CollectionSchema.prototype.updateConstrained = function(document, selector,
    modifier, options, callback) {
  var errors = this.expectation.run(document);

  if (errors && callback) {
    callback(errors);
    return;
  } else if (errors) {
    console.log('Errors:', errors);
    throw new Match.Error('collection.updateConstrainted() ' +
      'violated constraints.');
  }

  return this.collection.update.call(this.collection, selector, modifier,
    options, callback);
};
