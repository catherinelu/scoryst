// TODO: browserify
var RubricModel = Backbone.Model.extend({
  url: function() {
    var id = this.get('id');
    var collectionURL = this.collection.url();

    if (id) {
      return collectionURL + id + '/';
    } else {
      return collectionURL;
    }
  },

  sync: function(method, model, options) {
    options = options || {};
    options.beforeSend = Utils.beforeSendCSRFHandler;

    // students can only read rubrics
    if (Utils.IS_STUDENT_VIEW && method !== 'read') {
      throw "Can only read rubrics.";
    }

    return Backbone.sync.apply(this, arguments);
  },

  validate: function (attrs) {
    console.log('validating...');
    var errors = [];

    console.log(attrs.points);
    console.log(attrs.description);
    if (isNaN(attrs.points)) {
      errors.push({name: 'points', message: 'Please enter an integer point value.'});
    }

    if (!attrs.description) {
      errors.push({name: 'description', message: 'Please fill in the description field.'});
    }

    console.log(errors);
    return errors.length > 0 ? errors : false;
  }
});

var RubricCollection = Backbone.Collection.extend({
  model: RubricModel,

  initialize: function(models, options) {
    this.questionPart = options.questionPart;
  },

  url: function() {
    return window.location.pathname + 'question-part/' +
      this.questionPart.get('id') + '/rubrics/';
  },

  sync: function(method, model, options) {
    options = options || {};
    if (method !== 'read') {
      // we only allow reading the list of question parts
      throw 'Can only read the list of rubrics.';
    }

    return Backbone.sync.apply(this, arguments);
  }
});
