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
  var uri = combo.uri, html = combo.html, text = combo.text, selector = combo.selector;
  GLOBAL.info(name, uri, selector, text ? text.length : 'notext');
// empty input
  if (!html || html.length < 0 || !html.trim()) {
    return;
  }

  // process retrieved annotations
  markup(text, function(markedUp) {
console.log(markedUp);
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
        $('body').find(anno).each(function(i, w) {
          var exact = $($.html(w)).text();
          console.log('\nfound', anno, i, { exact: exact, attr: $(w).attr()});

          annoRows.push(annotations.createAnnotation({type: 'quote', annotatedBy: name, hasTarget: uri, quote: anno,
            ranges: annoLib.bodyInstancesFromMatches(exact, html, selector)}));
          candidates[w] = 1;
        });
      }
    });

console.log('found', annoRows.length);
    // TODO determine position in GATE document of annot and choose from indexed regexes
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


