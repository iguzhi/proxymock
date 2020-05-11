const portfinder = require('portfinder');
const { createWebServers, createExpress, createHttpServer, createHttpsServer } = require('./lib/servers/webServers');
const { createProxyServer } = require('./lib/servers/proxyServer');
const { setProxy, unsetProxy } = require('./lib/utils/systemProxy');
const { getLogger, setLevel } = require('./utils/logger');
const logger = getLogger('default');

/**
 * 启动代理Mock服务
 * @param {Object} ca { key, cert } https证书,
 * @param {Object} proxyServer { httpServer, httpsServer, ip, port } 指定proxy服务器绑定的ip和port及其将转发到的web服务器配置
 * @param {Object} rules { [req.method + ' ' + req.path]: {Object|Function} } 拦截请求和响应请求的规则
 * @param {Boolean} setSystemProxy 是否设置系统代理
 * @param {Object|String} logLevelConf 日志级别设置
 * httpServer、httpsServer: { ip, port }
 */
async function proxyMock({ ca = {}, proxyServer = {}, rules = {}, setSystemProxy = false }, logLevelConf) {
  logLevelConf && setLevel(logLevelConf);

  let { httpServer = {}, httpsServer = {}, ip, port } = proxyServer;
  const hasNecessaryHttpConf = httpServer.ip && httpServer.port;
  const hasNecessaryHttpsConf = httpsServer.ip && httpsServer.port;

  if (!hasNecessaryHttpConf || !hasNecessaryHttpsConf) {
    const expressApp = createExpress(rules);
    if (!hasNecessaryHttpConf) {
      const httpPort = await portfinder.getPortPromise({ startPort: 8000, stopPort: 9999 });
      const httpServerAddress = await createHttpServer(expressApp, httpPort);
      httpServer.ip = httpServerAddress.ip;
      httpServer.port = httpServerAddress.port;
    }
    if (!hasNecessaryHttpsConf) {
      const httpsPort = await portfinder.getPortPromise({ startPort: 8000, stopPort: 9999 });
      const httpsServerAddress = await createHttpsServer(expressApp, httpsPort, ca);
      httpsServer.ip = httpsServerAddress.ip;
      httpsServer.port = httpsServerAddress.port;
    }
  }

  if (!port) {
    port = await portfinder.getPortPromise({ startPort: 8000, stopPort: 9999 });
  }

  const proxyAddress = await createProxyServer({ ip, port, httpsServer, httpServer });

  if (setSystemProxy) {
    await setProxy(proxyAddress.ip, proxyAddress.port);
    console.log('System proxy has been set to %s:%s', proxyAddress.ip, proxyAddress.port);
    logger.info('System proxy has been set to %s:%s', proxyAddress.ip, proxyAddress.port);
  }

  process.on('SIGINT', async () => {
    if (setSystemProxy) {
      await unsetProxy();
      console.log('System proxy has been unset');
      logger.info('System proxy has been unset');
    }
    process.exit();
  });
}

process.on('uncaughtException', (error) => {
  // console.error('uncaughtException', error);
  logger.error('uncaughtException', error);
});

process.on('unhandledRejection', (error) => {
  // console.error('unhandledRejection', error);
  logger.error('unhandledRejection', error);
});

module.exports = {
  proxyMock,
  createWebServers,
  createExpress,
  createHttpServer,
  createHttpsServer,
  createProxyServer
};
