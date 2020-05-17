const portfinder = require('portfinder');
const chalk = require('chalk');
const { createWebServers, createExpress, createHttpServer, createHttpsServer, getState } = require('./lib/servers/webServers');
const { createProxyServer } = require('./lib/servers/proxyServer');
const { setProxy, unsetProxy } = require('./lib/utils/systemProxy');
const { parseRegExpRule, parseRegExpRules } = require('./lib/utils/ruleParser');
const { generateRootCA, getCAStatus, trustRootCA } = require('./lib/utils/certMgr');
const { getLogger, setLevel } = require('./lib/utils/logger');
const logger = getLogger('default');

/**
 * 启动代理Mock服务
 * @param {Object} ca { key, cert } https证书,
 * @param {Object} proxyServer { httpServer, httpsServer, ip, port } 指定proxy服务器绑定的ip和port及其将转发到的web服务器配置
 * @param {Object} rules { [req.method + ' ' + req.path]: {Object|Function} } 拦截请求和响应请求的规则
 * @param {Boolean} setSystemProxy 是否设置系统代理
 * @param {Object|String} logLevel 日志级别设置
 * @param {Boolean} disableCache 禁用缓存
 * httpServer、httpsServer: { ip, port }
 */
async function proxyMock({ ca = {}, proxyServer = {}, rules = {}, setSystemProxy = false, logLevel, disableCache = true }) {
  logLevel && setLevel(logLevel);

  let { ip, port } = proxyServer;

  const expressApp = createExpress(rules, disableCache);

  if (!port) {
    port = await portfinder.getPortPromise({ startPort: 8000 });
  }

  const proxyAddress = await createProxyServer({ ip, port, app: expressApp });

  if (setSystemProxy) {
    await setProxy(proxyAddress.ip, proxyAddress.port);
    console.log('%s System Proxy is set to %s:%s', chalk.green('[proxymock]'), chalk.yellow(proxyAddress.ip), chalk.yellow(proxyAddress.port));
    logger.info('[proxymock] System Proxy is set to %s:%s', proxyAddress.ip, proxyAddress.port);
  }

  process.on('SIGINT', async () => {
    if (setSystemProxy) {
      await unsetProxy();
      console.log(chalk.green('[proxymock]'), 'System Proxy is unset');
      logger.info('[proxymock] System Proxy is unset');
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
  createProxyServer,
  parseRegExpRule,
  parseRegExpRules,
  getState,
  // CA
  generateRootCA,
  getCAStatus,
  trustRootCA
};
