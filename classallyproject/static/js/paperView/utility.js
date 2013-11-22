function Utility() {}

Utility.getKeyFromValue = function (map, value) {
  for (var prop in map) {
    if (map.hasOwnProperty(prop)) {
      if (this[prop] === value)
        return prop;
    }
  }
}

Utility.isBlank = function (str) {
  return (!str || /^\s*$/.test(str));
};

Utility.getQueryVariable = function(variable) { 
  var query = window.location.search.substring(1); 
  var vars = query.split("&"); 
  for (var i=0;i<vars.length;i++)
  { 
    var pair = vars[i].split("="); 
    if (pair[0] == variable)
    { 
      return pair[1]; 
    } 
  }
  return -1; //not found 
}

function cl(text) {
  console.log(text);
}
