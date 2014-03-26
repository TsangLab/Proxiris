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

var name = 'GATE annotator';

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
    var annoRows = [];
    wantedAnnos.forEach(function(anno) {
      $('body').find(anno).each(function(i, found) {
        var exact = $(found).text();
        console.log('\nfound', anno, i, { text: text, text: $.html(found), attr: $(found).attr()});
        // determine what document instance this exact is
        annoRows.push(annotations.createAnnotation({type: 'quote', annotatedBy: name, hasTarget: uri, quote: exact, ranges: annoLib.bodyInstancesFromMatches(exact, html)}));
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


