const _ = require('lodash');
const portfinder = require('portfinder');
const createWebServers = require('./lib/servers/webServers');
const createProxyServer = require('./lib/servers/proxyServer');
const { caConf, proxyServerConf } = require('./config');

/**
 * 启动服务
 * @param {Object} { ca, proxyServer, router } 
 */
async function start({ ca, proxyServer, router }) {
  ca = _.merge({}, caConf, ca || {});
  const { httpPort, httpsPort } = await createWebServers(ca, router);

  proxyServer = _.merge({}, proxyServerConf, proxyServer);
  let { httpServer, httpsServer, ip, port, setSystemProxy } = proxyServer;
  if (!httpServer) {
    httpServer = {};
  }

  if (!httpServer.ip) {
    httpServer.ip = '127.0.0.1';
    httpServer.port = httpPort;
  }

  if (!httpsServer) {
    httpsServer = {};
  }

  if (!httpsServer.ip) {
    httpsServer.ip = '127.0.0.1';
    httpsServer.port = httpsPort;
  }

  if (!ip) {
    ip = '127.0.0.1';
  }

  if (!port) {
    port = await portfinder.getPortPromise({ startPort: 8000, stopPort: 9999 });
  }

  await createProxyServer({ ip, port, httpsServer, httpServer, setSystemProxy });
}

module.exports = start;
