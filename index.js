const { backupSysHostsConf, restoreSysHostsConf, useHostsConf } = require('./app/hostsAction');
// const { workPath, sysHostsPath } = require('./app/paths');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const portfinder = require('portfinder');

function initExpress(port = 9000, ruleConf = {}) {
  /**
   * Configure proxy middleware
   * {
   *   target: 'http://jsonplaceholder.typicode.com',
   *   changeOrigin: true, // for vhosted sites, changes host header to match to target's host
   *   logLevel: 'debug',
   * }
   */
  const jsonPlaceholderProxy = createProxyMiddleware(ruleConf);
  
  const app = express();
  
  /**
   * Add the proxy to express
   */
  app.use('/', jsonPlaceholderProxy);
  
  app.listen(port);
  
  console.log(`[ProxyMock] Server: listening on port ${port}`);
}

module.exports = (hostsConfPath, ruleConf) => {
  portfinder
  .getPortPromise({
    port: 9000,    // minimum port
    stopPort: 9999 // maximum port
  })
  .then((port) => {
    backupSysHostsConf();
    useHostsConf(hostsConfPath);
    initExpress(port, ruleConf);
  })
  .catch((err) => {
    restoreSysHostsConf();
    console.error(`[Error ProxyMock]: `, ruleConf);
  });

  process.on('SIG'); // TODO
}
