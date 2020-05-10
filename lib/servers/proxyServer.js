const net = require('net');
const { fixServerAddress } = require('../utils/fix');
const handleRequest = require('../handles/request');
const { getLogger } = require('../../utils/logger');
const proxyLogger = getLogger('proxy');

/**
 * 创建 Proxy Server
 * @param {Object} httpServer
 * @param {Object} httpsServer
 * @param {String} ip
 * @param {Integer} port
 * @return {Object}
 */
async function createProxyServer({ httpServer, httpsServer, ip, port }) {
  const proxy = net.createServer({ pauseOnConnect: true }, async clientSocket => {
    clientSocket.resume();
    await handleRequest(
      clientSocket,
      {
        httpsServerAddress: httpsServer,
        httpServerAddress: httpServer,
      }
    );

    clientSocket.on('end', () => {
      proxyLogger.debug('client disconnected');
    });
  });

  proxy.on('error', error => {
    proxyLogger.error(error.toString());
  });

  proxy.on('close', () => {
    proxyLogger.debug('proxy server closed');
  });

  await new Promise((resolve) => {
    proxy.listen(port, ip, () => resolve());
  });

  let addr = proxy.address();
  addr = fixServerAddress(addr);

  console.debug('proxy server listen on %s port %s', addr.ip, addr.port);
  proxyLogger.info('proxy server listen on %s port %s', addr.ip, addr.port);

  return addr;
}

module.exports = {
  createProxyServer
};
