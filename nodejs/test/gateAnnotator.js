var fs = require('fs'), expect = require("expect.js"), path = require('path');
var annotatorGate = require('../lib/annotators/gateAnnotator.js');

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
