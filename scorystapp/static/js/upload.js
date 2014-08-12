var UploadView = Backbone.View.extend({
  events: {
    'change #id_exam_id': 'render',
  },

  REFRESH_DURATION: 3000,
  template: _.template($('.progress-template').html()),

  initialize: function(options) {
    this.$examSelect = this.$('#id_exam_id');

    if (localStorage) {
      // Try to get the previous exam value from `localStorage`
      this.localStorageKey = 'uploadExamIdForCourse:' + this.$el.attr('data-course-id');
      var value = localStorage[this.localStorageKey];
      // Check if there is a previous value, and the exam id still exists
      if (value && this.$examSelect.find('option[value="' + value + '"]').length) {
        this.$examSelect.val(value);
      }
    }

    this.$uploadProgress = this.$('.upload-progress');
  },

  render: function() {
    // Update `localStorage.uploadExamId` and set the correct exam value
    if (localStorage) {
      localStorage[this.localStorageKey] = this.$examSelect.val();
    }

    var self = this;
    var examId = this.$examSelect.val();

    // fetch statistics for number of pages uploaded
    $.ajax({
      type: 'GET',
      url: 'split-pages/' + examId + '/',
    }).done(function(data) {
      var numTotalPages = data.numTotalPages;
      var numUploadedPages = data.numUploadedPages;
      var hasUploads = data.hasUploads;

      // update progress
      if (numTotalPages === 0) {
        self.$uploadProgress.html(self.template({
        hasUploads: hasUploads,
        examId: examId
        }));
      } else {
        self.$uploadProgress.html(self.template({
          numTotalPages: numTotalPages,
          numUploadedPages: numUploadedPages,
          percentUploaded: 100 * numUploadedPages / numTotalPages,
          examId: examId
        }));
      }

      self.refreshTimeout = setTimeout(_.bind(self.render, self),
        self.REFRESH_DURATION);
    });

    var infoPopoverText = '"Questions are on every other page" means there is ' +
    'a blank page/scratch paper between each page.';
    var $infoPopover = this.$('.info-popover');
    $infoPopover.popover({ content: infoPopoverText, placement: 'top' });
  }
  // TODO: set exam; immediately call render
});


$(function() {
  var uploadView = new UploadView({ el: $('.upload') });
  uploadView.render();
});
