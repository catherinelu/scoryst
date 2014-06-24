var MapSubmissionView = Backbone.View.extend({
  template: _.template($('.select-pages-template').html()),

  events: {
    'click .question-part-nav li': 'updateQuestionPart',
    'click .select-pages .page': 'selectPage',
    'click .zoom': 'showZoomedImage'
  },

  initialize: function(options) {
    this.submissionPages = new SubmissionPageCollection();
    this.responses = new ResponseCollection();

    this.$selectPages = this.$('.select-pages');
    this.$navLis = this.$('.question-part-nav li');
    this.$success = this.$('.success');

    this.$modal = $('.modal');
    this.$modalContent = this.$modal.find('.modal-content');
  },

  fetchAndRender: function() {
    this.fetching = true;
    var self = this;

    this.responses.fetch({
      success: function() {
        self.whenSubmissionPagesAreUploaded(function() {
          self.fetching = false;

          // show question 1, part 1 by default
          self.$navLis.eq(0).click();
          self.render();
        });
      }
    });
  },

  whenSubmissionPagesAreUploaded: function(callback) {
    var self = this;
    this.submissionPages.fetch({
      success: function() {
        if (self.submissionPages.length === pageCount) {
          callback();
        } else {
          // try again after waiting
          setTimeout(function() {
            self.whenSubmissionPagesAreUploaded(callback);
          }, 2000);
        }
      }
    });
  },

  render: function() {
    var templateData = {
      questionNumber: this.questionNumber,
      partNumber: this.partNumber,
      submissionPages: this.submissionPages.toJSON()
    };

    var self = this;
    templateData.submissionPages.forEach(function(page) {
      if (self.responsePages.indexOf(page.pageNumber) !== -1) {
        page.isSelected = true;
      }
    });

    this.$selectPages.html(this.template(templateData));
    this.showSuccessIfDone();
    window.resizeNav();
  },

  showSuccessIfDone: function() {
    var unmappedResponses = this.responses.where({ pages: '' });
    if (unmappedResponses.length === 0) {
      this.$success.show();
    } else {
      this.$success.hide();
    }
  },

  updateQuestionPart: function(event) {
    event.preventDefault();
    if (this.fetching) {
      return;
    }

    var $li = $(event.currentTarget);

    this.questionNumber = $li.data('question-number');
    this.partNumber = $li.data('part-number');

    // get response that corresponds to the new question part and re-render
    this.response = this.findResponseForQuestionPart(this.questionNumber, this.partNumber);

    // keep track of the pages that contain the response
    var responsePages = this.response.get('pages');
    if (responsePages === "") {
      responsePages = [];
    } else {
      responsePages = responsePages.split(',').map(function(page) {
        return parseInt(page, 10);
      });
    }

    this.responsePages = responsePages;
    this.render();

    this.$navLis.removeClass('active');
    $li.addClass('active');
  },

  showZoomedImage: function(event) {
    var $zoomButton = $(event.currentTarget);
    var $img = $zoomButton.siblings('img');

    this.$modalContent.empty();
    var $zoomedImg = $('<img />').attr('src', $img.attr('data-zoomed-src'));

    this.$modalContent.append($zoomedImg);
    this.$modal.modal();
  },

  findResponseForQuestionPart: function(questionNumber, partNumber) {
    return this.responses.findWhere({
      questionNumber: questionNumber,
      partNumber: partNumber
    });
  },

  selectPage: function(event) {
    var $page = $(event.currentTarget);
    var $container = $page.parent();

    var pageNumber = $page.attr('data-page-number');
    pageNumber = parseInt(pageNumber, 10);

    if ($container.hasClass('selected')) {
      // deselect page
      var index = this.responsePages.indexOf(pageNumber);
      this.responsePages.splice(index, 1);
    } else {
      // select page
      this.responsePages.push(pageNumber);
    }

    $container.toggleClass('selected');
    this.responsePages = _.sortBy(this.responsePages);
    this.response.save({ pages: this.responsePages.join(',') });
    this.showSuccessIfDone();
  }
});

$(function() {
  var mapSubmissionView = new MapSubmissionView(
    { el: $('.map-submission') });
  mapSubmissionView.fetchAndRender();
});