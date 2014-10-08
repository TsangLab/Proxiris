/* # GATE annotator
 *
 * extracts instance annotations from markup
*/

/*jslint node: true */

'use strict';

// relative location of sensebase for libs FIXME
var sensebase = '../../../node_modules/sensebase/';

var querystring = require('querystring'), http = require('http'), cheerio = require('cheerio');

var annoLib = require(sensebase + 'lib/annotators/annotateLib'), annotations = require(sensebase + 'lib/annotations'), utils = require('../../lib/utils.js');
exports.doProcess = doProcess;
exports.markup = markup;

// local configuration
var instanceProps = utils.getProperties('./pipeline.properties');
// indicate which annotations are interesting in the properties file
var wantedAnnos = instanceProps.annotations.split(',');

var name = instanceProps.name;

// wait for annotation requests
annoLib.requestAnnotate(doProcess);

function doProcess(combo, callback) {
  var uri = combo.uri, html = combo.html, text = combo.text, selector = combo.selector;
  GLOBAL.info(name, uri, selector, html ? html.length : 'nohtml');
// empty input
  if (!html || html.length < 0 || !html.trim()) {
    callback(null, { name: name, uri: uri, annoRows: []});
  }

  // process retrieved annotations
  markup(html, function(err, markedUp) {
    try {
      var $ = cheerio.load(markedUp);
    } catch (e) {
      GLOBAL.error(name, e);
      callback(e, name);
    }
    var annoRows = [], candidates = {};
    // do this in two passes; the first captures all annotation instances. The second adds GATE indicated instances.
    // pass one: capture all instances
    wantedAnnos.forEach(function(annoType) {
      if (!candidates[annoType]) {
        $(selector).find(annoType).each(function(i, w) {
          // now we have something that look like this
          // <Organism gate:gateId="12524" annot_type="Organism" class="Organism" organism_scientific_name="unidentified influenza virus" organism_alias="Influenza Virus" NCBI_Taxonomy_WebPage="http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=11309&amp;mode=info" NCBI_Taxonomy_ID="11309">Influenza Virus</Organism>
          // get its internal text and attributes
          var exact = $($.html(w)).text(), attributes = $(w).attr();
//          console.log('\nfound', annoType, i, { exact: exact, attr: attributes});

          annoRows.push(annotations.createAnnotation({type: 'quote', annotatedBy: name, hasTarget: uri, roots: annoType, quote: exact, attributes: attributes,
            ranges: annoLib.bodyInstancesFromMatches(exact, html, selector)}));
          candidates[w] = 1;
        });
      }
    });

    GLOBAL.info('found', annoRows.length);
    // TODO determine position in GATE document of annot and choose from indexed regexes
    callback(null, { name: name, uri: uri, annoRows: annoRows});
  });
}

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
        callback(null, data);
      });
  });

  postRequest.write(postData);
}
