const express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
const http = require('http');
const https = require('https');
const assert = require('assert');
const tls = require('tls');
const crypto = require('crypto');
const { URL } = require('url');
const _ = require('lodash');
const chalk = require('chalk');
const portfinder = require('portfinder');
const constants = require('constants');
const { parseRegExpRules } = require('../utils/ruleParser');
const certMgr = require('../utils/certMgr');
const { filterRequestHeaders, filterResponseHeaders, removeCacheHeaders } = require('../utils/filter');
const { getLogger } = require('../utils/logger');
const util = require('../utils/util');
const httpLogger = getLogger('http');
const httpsLogger = getLogger('https');

const state = Object.create(null);
/**
 * 启动web server
 * @param {Object} ca { key: '', cert: ''  }
 * @param {Object} rules { 'GET https://a.com/b?t=123': { a: 1, b: 2}, 'POST http://b.com/c': (req, res) => {} }
 * @return {Object} { httpServerAddress, httpsServerAddress }
 */
async function createWebServers(ca, rules) {
  const app = createExpress(rules);
  const httpServerAddress = await portfinder.getPortPromise({ startPort: 8000, stopPort: 9999 });
  await createHttpServer(app, httpPort);
  const httpsServerAddress = await portfinder.getPortPromise({ startPort: 8000, stopPort: 9999 });
  await createHttpsServer(app, httpsPort, ca || {});

  return { httpServerAddress, httpsServerAddress };
}

/**
 * 创建 Express App
 * @param {Object} rules 拦截规则
 * @param {Boolean} disableCache 禁用缓存
 * @return {Express}
 */
function createExpress(rules = {}, disableCache) {
  const regExpRules = parseRegExpRules(rules);

  // 防止rules和regExpRules被外部覆写
  Object.defineProperties(state, {
    rules: {
      value: rules,
      writable: false,
      configurable: false,
      enumerable: true
    },
    regExpRules: {
      value: regExpRules,
      writable: false,
      configurable: false,
      enumerable: true
    }
  });

  const app = express();

  app.use(cors({
    origin: '*'
  }));

  app.use((req, res, next) => {
    const logger = req.secure ? httpsLogger : httpLogger;

    const url = req.protocol + '://' + req.get('host') + req.path;
    const afterMatchKey = req.method + ' ' + url;
    let afterMatchedRule = rules[afterMatchKey]; // if function: (req, res, data) => {...}
    const beforeMatchKey = '^ ' + afterMatchKey;
    let beforeMatchedRule = rules[beforeMatchKey];

    if (!beforeMatchedRule && !afterMatchedRule) {
      // check url if match regexp rules
      for (let key in regExpRules) {
        const { phaseFlag, method, regexp, rule } = regExpRules[key];
        if (method === req.method && regexp.test(url)) {
          if (phaseFlag === '^') {
            beforeMatchedRule = rule;
          }
          else {
            afterMatchedRule = rule;
          }
          break;
        }
      }
    }

    req.afterMatchedRule = afterMatchedRule;
    req.beforeMatchedRule = beforeMatchedRule;

    logger.debug('afterMatchKey: ', afterMatchKey);
    logger.debug('afterMatchedRule: ', afterMatchedRule);
    logger.debug('beforeMatchKey: ', beforeMatchKey);
    logger.debug('beforeMatchedRule: ', beforeMatchedRule);

    // 只针对命中rules的请求应用bodyParser
    if (beforeMatchedRule || afterMatchedRule) {
      // 解析application/json
      bodyParser.json()(req, res, error => {
        error && logger.error('bodyParser.json', error);
        // 解析application/x-www-form-urlencoded
        bodyParser.urlencoded({ extended: false })(req, res, error => {
          error && logger.error('bodyParser.urlencoded', error);
          next();
        });
      });
    }
    else {
      next();
    }
  });

  app.use((req, res) => {
    const logger = req.secure ? httpsLogger : httpLogger;

    const reqHost = req.get('host');
    const reqUrl = req.protocol + '://' + reqHost + req.originalUrl;
    const afterMatchedRule = req.afterMatchedRule
    const beforeMatchedRule = req.beforeMatchedRule;
    const urlObj = new URL(reqUrl);

    delete req.afterMatchedRule;
    delete req.beforeMatchedRule;

    logger.debug('req.params', req.params);
    logger.debug('req.query', req.query);
    logger.debug('req.body', req.body);
    logger.debug('req.url', req.url);
    logger.debug('req.baseUrl', req.baseUrl);
    logger.debug('req.path', req.path);
    logger.debug('req.originalUrl', req.originalUrl);
    logger.debug('req.protocol', req.protocol);
    logger.debug('req.hostname', req.hostname);
    logger.debug('req.secure', req.secure);
    logger.debug('req.headers', req.headers);
    logger.debug('reqHost: ', reqHost);
    logger.debug('reqUrl: ', reqUrl);
    logger.debug('urlObj: ', urlObj);

    res.header('Proxy-Engine', 'ProxyMock');

    // 不发送真实请求, 直接返回beforeMatchedRule的数据
    if (beforeMatchedRule) {
      res.header('Proxy-Phase-Flag', '^');
      disableCache && res.header('Cache-Control', 'no-store');
      applyMatchedRule(beforeMatchedRule, req, res);
      return;
    }

    const headers = afterMatchedRule ? filterRequestHeaders(req.headers) : req.headers;
    if (disableCache) {
      removeCacheHeaders(headers);
      headers['Cache-Control'] = 'no-store';
    }

    const options = {
      hostname: req.hostname,
      port: urlObj.port || (req.secure ? 443 : 80),
      path: req.url,
      method: req.method,
      headers,
      requestCert: true,
      rejectUnauthorized: false
    };

    logger.debug('request options: ', options);

    const remoteRequest = (req.secure ? https : http).request(options, remoteResponse => {
      if (afterMatchedRule) {
        let data = '';
        // remoteResponse.setEncoding("utf8");
        const headers = filterResponseHeaders(remoteResponse.headers);
        if (disableCache) {
          removeCacheHeaders(headers);
          headers['Cache-Control'] = 'no-store';
        }
        res.header(headers);
        res.header('Proxy-Phase-Flag', '$');

        remoteResponse.on("data", trunk => {
          data += trunk;
        });

        // 当数据传输结束触发end
        remoteResponse.on("end" , () => {
          logger.debug('[%s end] ', req.protocol, data);
          applyMatchedRule(afterMatchedRule, req, res, data);
        });
      }
      else {
        const headers = remoteResponse.headers;
        if (disableCache) {
          removeCacheHeaders(headers);
          headers['Cache-Control'] = 'no-store';
        }
        res.writeHead(remoteResponse.statusCode, headers);
        remoteResponse.pipe(res);
      }
    })
    .on("error" , (err) => {
      logger.error('[%s Request] %s %s!', req.protocol, req.method, req.hostname + req.url, err);
    });

    req.pipe(remoteRequest);
    res.on('close', function() {
      remoteRequest.abort();
    });
  })

  return app;
}

/**
 * 创建 HTTP Server
 * @param {Express} app
 */
async function createHttpServer(app) {
  const httpPort = await portfinder.getPortPromise({ startPort: 8000, stopPort: 9999 });
  const httpServer = http.createServer(app);
  return new Promise((resolve) => {
    httpServer.listen(httpPort, () => resolve(httpServer));
  });
}

/**
 * 创建 HTTPS Server
 * @param {Express} app
 * @param {Integer} port
 * @param {String} remoteServerHost
 * @return {Object}
 */
// async function createHttpsServer(app, port, remoteServerHost) {

//   const ca = await new Promise((resolve, reject) => {
//     certMgr.getCertificate(remoteServerHost, (error, key, key) => {
//       if (error) return reject(error);
//       resolve({ key, cert });
//     });
//   });

//   const { key, cert } = ca;

//   if (!key || !cert) {
//     console.error(chalk.red('[proxymock]'), ca);
//     httpsLogger.error('[proxymock]', ca);
//     return;
//   }

//   const options = {
//     // secureOptions: constants.SSL_OP_NO_SSLv3 || constants.SSL_OP_NO_TLSv1,
//     key,
//     cert,
//     rejectUnauthorized: false
//   };

//   const httpsServer = https.createServer(options, app);
//   await new Promise((resolve) => {
//     httpsServer.listen(port, () => resolve());
//   });

//   let addr = httpsServer.address();
//   addr = fixServerAddress(addr);

//   console.info('%s HTTPS Server is listening on %s://%s:%s', chalk.green('[proxymock]'), chalk.yellow('https'), chalk.yellow(addr.ip), chalk.yellow(addr.port));
//   httpsLogger.info('[proxymock] HTTPS Server is listening on https://%s:%s', addr.ip, addr.port);

//   return addr;
// }
/////////////////////////////////


function SNIPrepareCert(serverName, SNICallback) {
  const createSecureContext = tls.createSecureContext || crypto.createSecureContext;
  certMgr.getCertificate(serverName, (error, key, cert) => {
    if (error) {
      httpsLogger.info('[proxymock] err occurred when prepare certs for SNI - ', error);
      console.error(chalk.red('[proxymock] err occurred when prepare certs for SNI -'), error);
      SNICallback(err);
    }
    else {
      const ctx = createSecureContext({
        key,
        cert
      });
      SNICallback(null, ctx);
    }
  });
}

/**
 * Create an https server
 * @param {Number} port
 * @param {Express} app
 */
function createHttpsSNIServer(port, app) {
  assert(port && app, 'invalid param for https SNI server');

  return new Promise((resolve) => {
    const server = https.createServer({
      secureOptions: constants.SSL_OP_NO_SSLv3 || constants.SSL_OP_NO_TLSv1,
      SNICallback: SNIPrepareCert,
    }, app).listen(port, () => resolve(server));
  });
}

function createHttpsIPServer(ip, port, app) {
  assert(ip && port && app, 'invalid param for https IP server');

  return new Promise((resolve, reject) => {
    certMgr.getCertificate(ip, (error, key, cert) => {
      if (error) return reject(error);
      const server = https.createServer({
        secureOptions: constants.SSL_OP_NO_SSLv3 || constants.SSL_OP_NO_TLSv1,
        key,
        cert,
      }, app).listen(port, () => resolve(server));
    });
  });
}

/**
 * 创建 HTTPS Server
 * @param {Express} app
 * @param {String} hostname
 * @return {Object}
 */
async function createHttpsServer(app, hostname) {
  const httpsPort = await portfinder.getPortPromise({ startPort: 8000, stopPort: 9999 });
  return hostname && util.isIp(hostname) ? await createHttpsIPServer(hostname, httpsPort, app) : await createHttpsSNIServer(httpsPort, app);
}
////////////////////////////////////////

async function applyMatchedRule(matchedRule, req, res, data) {
  if (_.isFunction(matchedRule)) {
    if (_.isString(data)) {
      try {
        data = JSON.parse(data);
      }
      catch(e) {}
    }
    const matchedData = await matchedRule(req, res, data);
    end(matchedData, res);
  }
  else {
    end(matchedRule, res);
  }
}

function end(data, res) {
  if (_.isPlainObject(data) || _.isArray(data)) {
    res.json(data);
  }
  else {
    res.end(data);
  }
}

function getState() {
  return state;
}

module.exports = {
  createWebServers,
  createExpress,
  createHttpServer,
  createHttpsServer,
  getState
};
