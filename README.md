Proxiris
========

Workgroup annotation

This is the developing Proxiris project, focused on workgroup annotation in a
team consisting of software and human agents. 

It is built with Node.js and ElasticSearch, and uses the Faye pub-sub
implementation to couple components, as well as a proxy that links the server
to browsers without use of a plugin. We are very excited to link to Open
Annotation efforts and re-use elements from other OA projects.

This version is an evaluation version focused on closed workgroups, so security
is all-or-nothing once logged in.

The overall system focuses on a component oriented design, so much of the code
developed in the project is located in other npm modules. For now, use the
following instructions to install Proxiris. In time this repository will
include code and an installation directly focused on TsangLab elements.

Installation
========

Presuming a Debian derived distro, you will need to have build-essentials installed;

`sudo apt-get install openjdk-7-jre-headless`

install elasticsearch .deb from http://www.elasticsearch.org/download/

`sudo service elasticsearch start`

Install Nodejs eg `curl https://raw.github.com/creationix/nvm/master/install.sh | sh`

`source ./nvm/nvm.sh`

`nvm install 0.10`

`git clone https://github.com/TsangLab/SenseBase.git`

`cd SenseBase`

`npm install`

… time passes …

`npm install winston`

Create a configjs file:


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
      uploadDirectory: './static/files',
      doCache : true,
      doAuth: true,
      logStream : { write: function() {}}
    }

Edit users.json to configure users.

Run `sh host/schema.sh proxiris` to create the ElasticSearch explicit mappings.

Start the HTTP service:

`node app.js`

Start any annotating services (eg REST based), for example the Sentiment service:

`cd annotateServices`

`node sentimentService` 

Start service pubsub agents, for Sentiment:

`cd lib/annotateServices`

`node sentiment`

If you'd like to host Proxiris on port 80:

`a2enmod proxy_http`

  <VirtualHost *:80>
      ServerName dashboard.my.great.domain

      ProxyRequests off

      <Proxy *>
          Order deny,allow
          Allow from all
      </Proxy>

      DocumentRoot /var/www/

      ProxyPass /lab !

      <Location />
          ProxyPass http://localhost:9999/ retry=0
          ProxyPassReverse http://localhost:9999/
      </Location>
          ErrorLog ${APACHE_LOG_DIR}/wc.error.log

          # Possible values include: debug, info, notice, warn, error, crit,
          # alert, emerg.
          LogLevel warn

          CustomLog ${APACHE_LOG_DIR}/wc.access.log combined
  </VirtualHost>

`sudo service apache2 restart`

To use Proxiris as a proxy
========

Configure your browser to access the web via my.great.domain, port 8089. Add your dashboard to proxy exceptions.

To access Proxiris' dashboard
========

Go to http://my.great.domain and see documents appear as they are accessed via proxy or dragged and dropped into the list.


