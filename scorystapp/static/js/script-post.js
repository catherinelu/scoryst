$(function() {
  // http://stackoverflow.com/questions/22071550/force-backbone-or-underscore-to-always-escape-all-variables
  if (typeof _ !== 'undefined') {
    _.templateSettings = {
      escape: /<%=([\s\S]+?)%>/g,
      interpolate: /<%-([\s\S]+?)%>/g,
      evaluate: /<%([\s\S]+?)%>/g
    };
  }
});
