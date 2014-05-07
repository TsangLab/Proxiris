// integration test for gate markups
// requires running GATE service

var fs = require('fs'), expect = require("expect.js"), path = require('path');
var annotatorGate = require('../lib/annotators/gateAnnotator.js');
var sampleDoc = fs.readFileSync('./data/annotated.html').toString();

describe('GATE markup', function(done){
  it('should mark up content', function(done) {
    annotatorGate.markup(sampleDoc, function(err, res) {
      expect(err).to.be.undefined;
      expect(res.length).to.be(861);
      done();
    });
  });
});

describe('gateAnnotator', function(done){
  it('should extract keyword instances', function(done) {
    var sampleDoc = fs.readFileSync('./data/annotated.html').toString();
    annotatorGate.doProcess({ uri: GLOBAL.config.HOMEPAGE + '/test', html: sampleDoc, selector: '.contents'}, function(err, result) {
      expect(err).to.be.undefined;
      var annos = result.annoRows;
      var l = annos.length;
      expect(l).to.be(21);
      done();
    });
  });
});
