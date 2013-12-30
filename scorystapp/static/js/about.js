$(function() {

  var TEAM_SIZE = 3;
  var arr = []
  for (var i = 0; i < TEAM_SIZE; i++) {
    arr.push(i);
  }
  var permutation = shuffle(arr);
  
  // Get existing td and th
  var $td = $('td');
  var $th = $('th');
  var $tr = $('tr');

  var $newtd = [];
  var $newth = [];
  for (var i = 0; i < TEAM_SIZE; i++) {
    $newth.push($th[permutation[i]]);
    $newtd.push($td[permutation[i]]);
  }

  $('tr').eq(0).html($newth);
  $('tr').eq(1).html($newtd);

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
