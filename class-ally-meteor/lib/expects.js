/* Short alias for Expectation. */
expects = function() {
  var args = Array.prototype.splice.call(arguments, 0);

  // construct a new expectation with the given arguments
  function Expect() {
    return Expectation.apply(this, args);
  }

  Expect.prototype = Expectation.prototype;
  return new Expect();
};

// default types for different expectations
Expectation.prototype.DEFAULT_TYPES = {
  pass: null,
  present: null,
  length: String,
  range: Number,
  email: String,
  regex: String,
  optional: null,
  choice: null,
  many: null,
  each: Array,
  schema: Object
};

function Expectation(type, name) {
  if (_.isString(type)) {
    // user didn't specify a type; first argument is name
    this.name = type;

    // use default type
    this.type = this.DEFAULT_TYPES[this.name];
    this.args = Array.prototype.splice.call(arguments, 1);
  } else {
    // user provided name and type
    this.name = name;
    this.type = type;
    this.args = Array.prototype.splice.call(arguments, 2);
  }
}

Expectation.prototype.run = function(data) {
  // don't check type if it's not provided
  if (this.type && !_['is' + this.type.name](data)) {
    return 'Expected type ' + this.type.name.toLowerCase() +
      ', but got type ' + (typeof data);
  }

  if (this.name) {
    return this[this.name].call(this, data);
  }
};

Expectation.prototype.pass = function() {
  return true;
};

Expectation.prototype.present = function(data) {
  if (data === null || data === undefined ||
      (this.type === String && data.length === 0) ||
      (this.type === Number && !_.isFinite(data))) {
    return 'Must be present';
  }
};

Expectation.prototype.length = function(data) {
  var min = this.args[0];
  var max = this.args[1];

  if (min && data.length < min) {
    return data + ' has a length shorter than ' + min;
  }

  if (max && data.length > max) {
    return data + ' has a length longer than ' + max;
  }
};

Expectation.prototype.range = function(data) {
  var min = this.args[0];
  var max = this.args[1];

  if (min && data < min) {
    return data + ' is not at least ' + min;
  }

  if (max && data > max) {
    return data + ' is not at most ' + max;
  }
};

Expectation.prototype.EMAIL_REGEX = /^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,4}$/i;
Expectation.prototype.email = function(data) {
  this.args[0] = this.EMAIL_REGEX;
  return this.regex(data);
};

Expectation.prototype.regex = function(data) {
  var regex = this.args[0];

  if (!regex.test(data)) {
    return data + ' was in the wrong format';
  }
};

Expectation.prototype.optional = function(data) {
  var expectation = this.args[0];
  var dataNotPresent = (data === null || data === undefined ||
        (_.isString(data) && data.length === 0));

  if (!dataNotPresent && expectation) {
    return expectation.run(data);
  }
};

Expectation.prototype.choice = function(data) {
  var choices = this.args[0];

  if (!_.contains(choices, data)) {
    return data + ' is not one of [' + choices.join(', ') + ']';
  }
};

Expectation.prototype.many = function(data) {
  var error;

  _(this.args).each(function(expectation) {
    error = error || expectation.run(data);
  });

  return error;
};

Expectation.prototype.each = function(data) {
  var expectation = this.args[0];
  var error;

  _(data).each(function(element) {
    error = error || expectation.run(element);
  });

  return error;
};

Expectation.prototype.schema = function(data) {
  var schema = this.args[0];
  var errors = {};

  var diffDataSchema = _.difference(_.keys(data), _.keys(schema));

  // check for keys not in schema
  if (diffDataSchema) {
    _(diffDataSchema).each(function(key) {
      errors[key] = 'Key not in schema.';
    });
  }

  if (!_.isEmpty(errors)) {
    return errors;
  }

  // ensure validations for every property pass
  _.each(schema, function(expectation, key) {
    var error = expectation.run(data[key]);
    if (error) {
      errors[key] = error;
    }
  });

  if (!_.isEmpty(errors)) {
    return errors;
  }
};
