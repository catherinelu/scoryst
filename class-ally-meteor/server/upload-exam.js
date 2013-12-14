var Future = Npm.require('fibers/future');
var crypto = Npm.require('crypto');

Meteor.methods({
  uploadToS3: function(data) {
    // TODO: security; restrict user
    // TODO: validation
    if (!data || data.length > UploadExam.MAX_FILE_SIZE) {
      throw new Meteor.Error('Data was not provided or was too long.');
    }

    // use sha512 to generate a unique file name
    var sha = crypto.createHash('sha512');
    sha.update(data);

    var fileName = sha.digest();
    var headers = {
      'Content-length': data.length,
      'Content-type': UploadExam.PDF_MIME_TYPE,

      // TODO: permissions
      'x-amz-acl': 'public-read'
    };

    var future = new Future();

    // TODO: s3 credentials
    var client = Knox.createClient();
    var request = client.putBuffer(data, fileName, headers, function(error, response) {
      if (error) {
        throw error;
      } else {
        if (response.statusCode === 200) {
          console.log('url!', request.url);
          future.return(request.url);
        }
      }
    });

    return future.wait();
  }
});
