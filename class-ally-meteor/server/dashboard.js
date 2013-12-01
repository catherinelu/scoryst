Meteor.methods({
  /* Creates a student that's in the given class.
   *
   * Arguments:
   * studentFields -- the fields for the user that'll be created
   * classID -- ID of the class to add the user to
   */
  createStudentForClass: function(studentFields, classID, students) {
    console.log('fn called');
    // TODO: error handling on server
    // console.log('check result', check(studentFields, StudentSchema));

    // user = Accounts.createUser(studentFields);
    // students.push(user._id);

    // Class.update({ _id: classID },
    //   { $set: { students: students } });
    return true;
  }
});
