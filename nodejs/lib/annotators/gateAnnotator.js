// GATE annotator
// extracts instance annotations from markup


// relative location of sensebase for libs FIXME
var sensebase = '../../../node_modules/sensebase/';

var querystring = require('querystring'), http = require('http'), cheerio = require('cheerio');

var annoLib = require(sensebase + 'lib/annotators/annotateLib'), annotations = require(sensebase + 'lib/annotations'), utils = require('../../lib/utils.js');

// local configuration
var instanceProps = utils.getProperties('java/pipeline.properties');
var wantedAnnos = instanceProps.annotations.split(',');

var name = 'GATE annotator';

// wait for annotation requests
annoLib.requestAnnotate(function(combo) {
  var uri = combo.uri, html = combo.html, text = combo.text;
  GLOBAL.info(name, uri, text.length);

  try {
    var $ = cheerio.load(markedUp);
  } catch (e) {
    GLOBAL.error(name, e);
    return;
  }
  wantedAnnos.forEach(function(anno) {
    $.find(anno).forEach(function(found) {
      console.log(found);
    });
  });
  
  // process each individual callback
  candidates(text, function(markedUp) {

    var annoRows = [], score = json[0].r.score;
    annoRows.push(annotations.createAnnotation({type: 'value', annotatedBy: name, hasTarget: uri, key: 'score', value : score }));

    var seen = {};
    ['positive', 'negative'].forEach(function(set) {
      json[0].r[set].words.forEach(function(w) {
        if (!seen[w]) {
          annoRows.push(annotations.createAnnotation({type: 'quote', annotatedBy: name, hasTarget: uri, quote: w, ranges: annoLib.bodyInstancesFromMatches(w, html)}));
          seen[w] = 1;
        }
      });
    });

    annoLib.publishAnnotations(uri, annoRows);
  });
});

// make a post request and callback results
function candidates(text, callback) {
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


