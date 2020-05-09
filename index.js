const portfinder = require('portfinder');
const createWebServers = require('./lib/servers/webServers');
const createProxyServer = require('./lib/servers/proxyServer');

/**
 * 启动代理Mock服务
 * @param {Object} { ca, proxyServer, rules } 
 * @param {Object} ca { key, cert } https证书,
 * @param {Object} proxyServer { httpServer, httpsServer, ip, port } 指定proxy服务器绑定的ip和port及其将转发到的web服务器配置
 * @param {Object} rules { [req.method + ' ' + req.path]: {Object|Function} } 拦截请求和响应请求的规则
 * @param {Boolean} setSystemProxy 是否设置系统代理
 * httpServer、httpsServer: { ip|host, port }
 */
async function proxyMock({ ca = {}, proxyServer = {}, rules = {}, setSystemProxy = false }) {
  const { httpPort, httpsPort } = await createWebServers(ca, rules);

  let { httpServer, httpsServer, ip, port } = proxyServer;
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

module.exports = proxyMock;
