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

    // fetch statistics for number of pages uploaded
    $.ajax({
      type: 'GET',
      url: 'split-pages/' + this.$examSelect.val() + '/',
    }).done(function(data) {
      var numTotalPages = data.numTotalPages;
      var numUploadedPages = data.numUploadedPages;

      // update progress
      if (numTotalPages === 0) {
        self.$uploadProgress.html(self.template());
      } else {
        self.$uploadProgress.html(self.template({
          numTotalPages: numTotalPages,
          numUploadedPages: numUploadedPages,
          percentUploaded: 100 * numUploadedPages / numTotalPages
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
