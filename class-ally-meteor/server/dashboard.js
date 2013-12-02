Meteor.methods({
  /* Creates a student that's in the given class. If a student with the
   * given email already exists, adds that student to the class.
   *
   * Arguments:
   * studentFields -- the fields for the user that'll be created
   * classID -- ID of the class to add the user to
   */
  createStudentForClass: function(studentFields, classModel) {
    var error = StudentSchema.run(studentFields);
    if (error) {
      return error;
    }

    var user = Meteor.users.findOne({ 'emails.address': studentFields.email });
    var userID;

    if (user) {
      userID = user._id;
    } else {
      userID = Accounts.createUser(studentFields);
    }

    var students = classModel.students;
    if (!_.contains(students, userID)) {
      // TODO: confirm user can edit class
      // TODO: confirm classModel matches schema
      try {
        Class.update(classModel._id, { $push: { students: userID } });
      } catch (error) {
        console.log('class update error');
        return error;
      }
    }
  }
});
