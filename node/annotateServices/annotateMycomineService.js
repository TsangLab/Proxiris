var http = require('http'), querystring = require('querystring'), java = require("java"), fs = require('fs'), url = require('url'), path = require('path');

java.classpath = java.classpath.concat([ "target/", "java/lib/gate.jar", "java/lib/ant.jar", "java/lib/ivy.jar", "java/lib/jaxen.jar", 
  "java/lib/commons-io.jar", "java/lib/commons-lang.jar", "java/lib/commons-logging.jar", "java/lib/dom4j.jar", "java/lib/gate-asm.jar", 
  "java/lib/gate-compiler-jdt.jar", "java/lib/jdom.jar", "java/lib/log4j/log4j.jar", "java/lib/nekohtml.jar", "java/lib/tika-core.jar", 
  "java/lib/xercesImpl.jar", "java/lib/xstream.jar" ].map(function(p) { return path.join(__dirname, '../../' + p);}));
console.log(java.classpath);

var TextMiningPipeline = java.import('csfg.TextMiningPipeline');
var pipe = new TextMiningPipeline();
pipe.initSync('/home/david/Proxiris/java/pipeline.properties');
console.log("ready");

http.createServer(function(request, response) {
    if (request.method == 'POST') {
		postRequest(request, response, function() {
			pipe.processTextSync(response.post.data);
			var ret = ''+pipe.getDocResultSync();

			fs.writeFile("/tmp/gateResult.html", ret, function(err) { if (err) { console.log(err) } });

			response.writeHead(200, "OK", {'Content-Type': 'text/html'});
			response.write(ret);
			response.end();
		});
    }
	else {
		var path = url.parse(request.url).pathname;
		if (path === '/') {
			response.writeHead(200, "OK", {'Content-Type': 'text/html'});
			response.write('<form method="post"><textarea name="data"></textarea><input type="submit" /></form>');
			response.end();
		}
		else {
			console.log("Unknown path " + path);
		}
  }

}).listen(9000);

function postRequest(request, response, callback) {
    var queryData = "";
    request.on('data', function(data) {
        queryData += data;
        if(queryData.length > 1e6) {
            queryData = "";
            response.writeHead(413, {'Content-Type': 'text/plain'});
            request.connection.destroy();
        }
    });

    request.on('end', function() {
        response.post = querystring.parse(queryData);
        callback();
    });
}

