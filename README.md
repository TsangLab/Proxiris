Proxiris
========

Workgroup annotation

This is the developing Proxiris project, focused on workgroup annotation in a
team consisting of software and human agents.

It is built on Sensebase, a general system for document storage and annotation based on Node.js and ElasticSearch.

This version is a developing version focused on closed workgroups, so security
is all-or-nothing once logged in.

The overall system focuses on a component oriented design, much of the code
developed in the project is located in npm modules. Use the following
instructions to install Proxiris. In time this repository will include TsangLab
elements and a simpler installation, but please file an issue if you have
difficulty today.

Installation
========

Presuming a Debian derived distro:

`sudo apt-get install build-essential openjdk-7-jre-headless`

Install elasticsearch .deb from http://www.elasticsearch.org/download/

`sudo service elasticsearch start`

Install Node.js (via NVM)

`curl https://raw.github.com/creationix/nvm/master/install.sh | sh`

`source ./nvm/nvm.sh`

`nvm install 0.10`

npm install sensebase

`cd SenseBase`

`npm install`

… time passes …

Install dev deps:

`npm install winston`

`npm install -g bower`

`npm install -g grunt-cli`

Install third party client JavaScript libs:

`bower install`

Create a config.js file:


    // logging
    var winston = require('winston');

    GLOBAL.debug = winston.debug;
    GLOBAL.info = winston.info;
    GLOBAL.warn = winston.warn;
    GLOBAL.error = winston.error;

    var domain = 'my.great.domain';
    var esOptions ={ _index : 'proxiris', server : { host : 'es.' + domain, port : 9200 }};

    exports.config = {
      project: 'proxiris',
      DOMAIN: domain,
      FAYEHOST: 'http://faye.' + domain + ':9999/montr',
      ESEARCH:  esOptions,
      ESEARCH_URI: 'http://es.' + domain + ':' + esOptions.server.port + '/' + esOptions._index,
      HOMEPAGE: 'http://dashboard.' + domain,
      AUTH_PORT: 9999,
      PROXY_PORT: 8089,
      SPOTLIGHT: { host: 'spotlight' + domain, port: 7272},
      SENTIMENT: { host: 'sentiment' + domain, port: 9002},
      NOCACHE_REGEX: '.*.' + domain,
      CACHE_DIR : '/some/dir',
      uploadDirectory: './uploads',
      doCache : true,
      doAuth: true,
      logStream : { write: function() {}}
    }

Create the defined uploadDirectory for serving those files.

Run `node utils/reset` to create the ElasticSearch mappings.

Start the HTTP service:

`node app.js`

Annotators
========

Annotators connect to the general system via a publication-subscribe system.
They may be standalone, or they may have a wrapping service to connect them to
a long running process. The GATE and Sentiment pipeline works this way.

To manually start annotation, for example the Sentiment service:

`cd annotateServices`

`node sentimentService`

Start service pubsub agents, for Sentiment:

`cd lib/annotateServices`

`node sentiment`

GATE pipeline
========

The GATE pipeline takes GATE tagged documents and transform them into instance annotations.

To configure the GATE pipeline:

`cp pipeline.properties.sample pipeline.properties`

`$EDITOR pipeline.properties`

Note absolute paths are used to avoid much sorrow and pain when compiling and executing.

Edit as appropriate. The sample is for https://github.com/TsangLab/Annotators

then

`cd java`

`ant` to compile, or `ant run-pipeline` to test.

then execute:

`node nodejs/annotateServices/annotateGATEService.js`

to start the GATE service on port 9009. This program runs a number of sanity checks to help debug.

then execute (in another terminal):

`node nodejs/services/annotators/gateAnnotator.js <path to SenseBase>`

to start the pubsub agent.

To use Proxiris as a proxy
========

Configure your browser to access the web via my.great.domain, port 8089. Add your dashboard to proxy exceptions.

To access Proxiris' dashboard
========

Go to http://my.great.domain and see documents appear as they are accessed via proxy or dragged and dropped into the list.
