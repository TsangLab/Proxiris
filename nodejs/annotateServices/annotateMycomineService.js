var http = require('http'), querystring = require('querystring'), java = require("java"), fs = require('fs'), url = require('url'), path = require('path');

var javaPropsLoc = 'java/pipeline.properties', javaProps = {};

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

java.classpath = java.classpath.concat(javaProps['libs.list'].split(',').map(function(p) { return path.join(__dirname, javaProps['lib.home'], p);}));
java.classpath.push('target/');
console.log(java.classpath);

var TextMiningPipeline = java.import('csfg.TextMiningPipeline');
var pipe = new TextMiningPipeline();
pipe.initSync('java/pipeline.properties');
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

