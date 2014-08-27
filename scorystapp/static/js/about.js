$(function() {

  var TEAM_SIZE = 2;
  var arr = []
  for (var i = 0; i < TEAM_SIZE; i++) {
    arr.push(i);
  }
  var permutation = shuffle(arr);

  // Get existing td and th
  var $col = $('.about .col-xs-6');

  var $newcol = [];
  for (var i = 0; i < TEAM_SIZE; i++) {
    $newcol.push($col[permutation[i]]);
  }

  $('.row.about').html($newcol);

  // The Fisher-Yates (Knuth) Shuffle
  // So beautiful there are tears in your eyes
  function shuffle(array) {
    var currentIndex = array.length;
    var temporaryValue;
    var randomIndex;

    // There remain elements to shuffle
    while (currentIndex !== 0) {

      // Pick a random remaining element
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // Swap
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }
});
