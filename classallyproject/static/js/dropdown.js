$(function() {
  // show dropdown menu on hover
  $('.dropdown').hover(function() {
    $(this).children('.dropdown-menu').show();
  }, function() {
    $(this).children('.dropdown-menu').hide();
  });
});
