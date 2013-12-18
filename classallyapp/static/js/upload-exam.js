var PDF_MIME_TYPE = 'application/pdf';

Template['upload-exam'].events({
  'submit .add-exam': function(event) {
    event.preventDefault();
    var $form = $(event.target);
    var name = $form.find('#name').val();

    var examFile = $form.find('#exam')[0].files[0];
    var solutionsFile = $form.find('#solutions')[0].files[0];

    // TODO: validation
    if (!name || !examFile || /* !solutionsFile || */
        examFile.size > UploadExam.MAX_FILE_SIZE ||
        // solutionsFile > UploadExam.MAX_FILE_SIZE ||
        examFile.type !== PDF_MIME_TYPE /* ||
        solutionsFile.type !== PDF_MIME_TYPE */) {
      return;
    }


    // TODO: file APIs not entirely supported
    if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
      return;
    }

    var reader = new FileReader();
    reader.addEventListener('loadend', function(event) {
      console.log('inside load end');
      if (reader.readyState === FileReader.DONE) {
        Meteor.call('uploadToS3', reader.result, function(error, examPath) {
          if (error) {
            console.log('got error', error);
          } else {
            console.log('got exam path', examPath);
            // create Exam TODO: security?
            var examId = Exam.insert({
              name: name,
              examPath: examPath,
              solutionsPath: solutionsPath
            });

            Session.set('exam', Exam.findOne(examId));
            // Router.go('/create-exam');
          }
        });
      }
    });

    reader.readAsBinaryString(examFile);
    // var solutionsData = reader.readAsBinaryString(solutionsFile);

    // // upload exam + solutions to S3
    // Meteor.call('uploadToS3', examData, function(examPath) {
    //   Meteor.call('uploadToS3', solutionsData, function(solutionsPath) {
    //     // create Exam TODO: security?
    //     var examId = Exam.insert({
    //       name: name,
    //       examPath: examPath,
    //       solutionsPath: solutionsPath
    //     });

    //     Session.set('exam', Exam.findOne(examId));
    //     Router.go('/create-exam');
    //   });
    // });
  }
});
