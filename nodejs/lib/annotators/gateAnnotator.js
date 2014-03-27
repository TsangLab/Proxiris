// GATE annotator
// extracts instance annotations from markup


// relative location of sensebase for libs FIXME
var sensebase = '../../../node_modules/sensebase/';

var querystring = require('querystring'), http = require('http'), cheerio = require('cheerio');

var annoLib = require(sensebase + 'lib/annotators/annotateLib'), annotations = require(sensebase + 'lib/annotations'), utils = require('../../lib/utils.js');

// local configuration
var instanceProps = utils.getProperties('./pipeline.properties');
// indicate which annotations are interesting in the properties file
var wantedAnnos = instanceProps.annotations.split(',');

var name = instanceProps.name;

// wait for annotation requests
annoLib.requestAnnotate(function(combo) {
  var uri = combo.uri, html = combo.html, text = combo.text;
  GLOBAL.info(name, uri, text.length);

  // process retrieved annotations
  markup(text, function(markedUp) {
    try {
      var $ = cheerio.load(markedUp);
    } catch (e) {
      GLOBAL.error(name, e);
      return;
    }
    var annoRows = [], candidates = {};
    // do this in two passes; the first captures all annotation instances. The second adds GATE indicated instances.
    // pass one: capture all instances
    wantedAnnos.forEach(function(anno) {
      if (!candidates[anno]) {
        $('body').find(anno).each(function(i, found) {
          var exact = $(found).text();
          candidates[anno] = annoLib.bodyInstancesFromMatches(exact, html);
        });
      }
    });

    // pass: two extract indicated instances
    wantedAnnos.forEach(function(anno) {
      $('body').find(anno).each(function(i, found) {
        console.log('LL', $(found).attr('id'), candidates[anno]);
      });
    });

    annoLib.publishAnnotations(uri, annoRows);
  });
});

// make a post request and callback results
function markup(text, callback) {
  var postData = querystring.stringify({data : text});

  var postOptions = {
      host: instanceProps.host,
      port: instanceProps.port,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
  };
  var data = '';
  var postRequest = http.request(postOptions, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          data += chunk;
      });
      res.on('end', function() {
        callback(data);
      });
  });

  postRequest.write(postData);
}


