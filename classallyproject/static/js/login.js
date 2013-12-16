Template.login.events({
  'submit form': function(event) {
    event.preventDefault();
    var $form = $(event.target);

    var email = $form.find('[name="email"]').val();
    var password = $form.find('[name="password"]').val();

    if (email && password) {
      // TODO: prevent brute force attacks
      Meteor.loginWithPassword(email, password);

      // TODO: notify if login failed
    }
  }
});
