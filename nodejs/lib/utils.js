/* # utils
 * General utilities for Proxiris project.
 */

/*jslint node: true */

'use strict';

var fs = require('fs');

exports.getProperties = function(javaPropsLoc) {
  var javaProps = {};

  try {
    var propsText = fs.readFileSync(javaPropsLoc);
      propsText.toString().split('\n').forEach(function(t) {
        var s = t.split('=');
        if (s[1]) {
          javaProps[s[0].trim()] = s[1].trim();
        }
    });
  } catch (e) {
    throw Error('error reading java properties ' + javaPropsLoc + ': ' + e);
  }
  return javaProps;
};
