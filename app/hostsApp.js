const { backupSysHostsConf, restoreSysHostsConf, useHostsConf } = require('../lib/hostsAction');
const express = require('express');
const cors = require('cors');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * create server
 * @param {Integer} port 
 * @param {Object} router 
 * {
 *    'POST /user': function(req, res, next) {},
 *    'GET /session': function(req, res, next) {}
 * }
 */
function createServer(httpPort = 80, httpsPort = 443, router = {}) {
  const app = express();
  app.use(cors({
    origin: '*' //允许访问的目标站点
  }));

  const options = {
    key: fs.readFileSync(path.resolve(__dirname, '../cert/server.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, '../cert/server.crt'))
  };
  const httpsServer = https.createServer(options, app);
  const httpServer = http.createServer(app);

  for (let key in router) {
    const route = router[key];
    const list = key.split(/\s/);
    const method = list[0].toLowerCase();
    const url = list[1];
    console.log('register route on server', method, url, route)
    app[method] && app[method](url, route);
  }

  httpServer.listen(httpPort, () => console.log('[ProxyMock] HTTP Server is listening on: http://localhost:%s', httpPort));
  httpsServer.listen(httpsPort, () => console.log('[ProxyMock] HTTPS Server is listening on: https://localhost:%s', httpsPort));
}

module.exports = ({ hostsConfPath, httpPort, httpsPort, router }) => {
  backupSysHostsConf();
  useHostsConf(hostsConfPath);
  createServer(httpPort, httpsPort, router);

  process.on('SIGINT', function () {
    restoreSysHostsConf();
    process.exit();
  });
}
