var http = require('http'), querystring = require('querystring'), java = require("java"), fs = require('fs'), url = require('url'), path = require('path'),
    utils = require('./../lib/utils.js');

var javaProps = utils.getProperties('java/pipeline.properties');

if (!fs.existsSync('target/proxiris.jar')) {
  throw Error('please create proxiris.jar by typing ant in the java directory');
}

console.log('checking jar path');
java.classpath = java.classpath.concat(javaProps['libs.list'].split(',').map(function(p) { 
  var f = path.join(javaProps['libs.home'], p)
  if (!fs.existsSync(f)) {
    throw Error('property jar not found ' + f);
  }
  return f;
}));
java.classpath.push('target/');

var TextMiningPipeline = java.import('csfg.TextMiningPipeline');
var pipe = new TextMiningPipeline();
try {
  pipe.initSync('java/pipeline.properties');
} catch(e) {
  console.log('failed calling init. standalone invocation:\njava -cp ', java.classpath.join(':'), 'csfg.TextMiningPipeline');
  throw e;
}

console.log('ready');

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

}).listen(javaProps.port);

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

