const net = require('net');
const handleRequest = require('../handles/request');
const { setProxy, unsetProxy } = require('../utils/systemProxy');
const { getLogger } = require('../../utils/logger');
const proxyLogger = getLogger('proxy');


async function createServer({ httpServer, httpsServer, ip, port, setSystemProxy }) {
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
  
  proxy.on('error', err => {
    proxyLogger.error(err.toString());
  });

  proxy.on('close', () => {
    proxyLogger.debug('proxy server closed');
  });

  await new Promise((resolve) => {
    proxy.listen(port, ip, () => resolve());
  });
  const addr = proxy.address();
  console.debug('proxy server listen on %s port %s', addr.address, addr.port);
  if (setSystemProxy) {
    setProxy(addr.address, addr.port);
    console.log('System proxy has been set to %s:%s', addr.address, addr.port);
  }

  process.on('SIGINT', () => {
    if (setSystemProxy) {
      unsetProxy();
      console.log('System proxy has been unset');
    }
  });
}

module.exports = createServer;