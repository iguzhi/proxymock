const express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const _ = require('lodash');
const portfinder = require('portfinder');
const { fixServerAddress } = require('../utils/fix');
const { getLogger } = require('../../utils/logger');
const httpLogger = getLogger('http');
const httpsLogger = getLogger('https');

const localIP = '127.0.0.1';

const requiredRequestHeaderFields = [
  'Host',
  'Connection',
  'Pragma',
  'Cache-Control',
  'User-Agent',
  'Content-Type',
  'X-Requested-With',
  'Accept',
  // 'Accept-Encoding', // must be removed, for proxy server maybe have no ability to ungzip received data.
  'Accept-Language',
  'Accept-Charset',
  'Cookie',
  'Origin',
  'Referer',
  'Authorization',
  'If-Modified-Since'
];

const requiredResponseHeaderFields = [
  'Allow',
  'Age',
  'Connection',
  'Pragma',
  'Cache-Control',
  'Content-Type',
  // 'Content-Length', // must be removed, for proxy server received data is not gzipped, and the length is changed.
  'Location',
  'Date',
  'Server',
  'Vary',
  'Expires',
  'Last-Modified',
  'Set-Cookie',
  'Status',
  'X-Powered-By',
  'Content-Language',
  'Refresh',
  'ETag'
];

function filterHeaders(inputHeader, requiredHeaderFields) {
  const lowerCaseInputHeader = {};
  for (let inputHeaderKey in inputHeader) {
    if (inputHeader.hasOwnProperty(inputHeaderKey)) {
      lowerCaseInputHeader[inputHeaderKey.toLowerCase()] = inputHeader[inputHeaderKey];
    }
  }
  const header = {};
  requiredHeaderFields.forEach(field => {
    const value = lowerCaseInputHeader[field.toLowerCase()];
    if (value) {
      header[field] = value;
    }
  });
  return header;
}

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
 * @param {Object} rules
 * @return {Express}
 */
function createExpress(rules = {}) {
  const app = express();
  app.use(cors({
    origin: '*'
  }));

  // 解析application/json
  app.use(bodyParser.json());
  // 解析application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }));

  app.use(async (req, res) => {
    const logger = req.secure ? httpsLogger : httpLogger;

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

    const headers = filterHeaders(req.headers, requiredRequestHeaderFields);

    const reqHost = req.get('host');
    const reqUrl = req.protocol + '://' + reqHost + req.originalUrl;
    const afterMatchKey = req.method + ' ' + req.protocol + '://' + reqHost + req.path;
    const afterMatchedRule = rules[afterMatchKey]; // if function: (req, res, data) => {...}
    const beforeMatchKey = '^ ' + afterMatchKey;
    const beforeMatchedRule = rules[beforeMatchKey];
    const urlObj = new URL(reqUrl);
    logger.debug('reqHost: ', reqHost);
    logger.debug('reqUrl: ', reqUrl);
    logger.debug('afterMatchKey: ', afterMatchKey);
    logger.debug('afterMatchedRule: ', afterMatchedRule);
    logger.debug('beforeMatchKey: ', beforeMatchKey);
    logger.debug('beforeMatchedRule: ', beforeMatchedRule);
    logger.debug('urlObj: ', urlObj);

    res.header('Proxy-Engine', 'ProxyMock');

    // 不发送真实请求, 直接返回beforeMatchedRule的数据
    if (beforeMatchedRule) {
      res.header('Proxy-Phase-Tag', '^');
      applyMatchedRule(beforeMatchedRule, req, res);
      return;
    }

    const options = {
      hostname: req.hostname,
      port: urlObj.port || (req.secure ? 443 : 80),
      path: req.url,
      method: req.method,
      headers
    };

    logger.debug('request options: ', options);

    let data = '';
    const r = (req.secure ? https : http).request(options, rsp => {
      // 设置编码格式
      // rsp.setEncoding("utf8");
      // 还原response headers
      // res.header(rsp.headers);
      const rspHeaders = filterHeaders(rsp.headers, requiredResponseHeaderFields);
      res.header(rspHeaders);
      logger.debug('rspHeaders: ', rspHeaders);

      // 数据传输过程中会不断触发data信号
      rsp.on("data", trunk => {
        data += trunk;
      });

      // 当数据传输结束触发end
      rsp.on("end" , () => {
        logger.debug('[%s end] ', req.protocol, data);
        if (afterMatchedRule) {
          res.header('Proxy-Phase-Tag', '$');
          applyMatchedRule(afterMatchedRule, req, res, data);
          return;
        }
        // 把data数据返回前端
        res.end(data);
      });
    })
    .on("error" , (err) => {
      logger.error('[%s Request] %s %s!', req.protocol, req.method, req.hostname + req.url, err);
    });
    if (req.method === 'POST' || req.method === 'PUT') {
      req.body && r.write(JSON.stringify(req.body));
    }
    r.end();
  })

  return app;
}

/**
 * 创建 HTTP Server
 * @param {Express} app
 * @param {Integer} port
 * @return {Object}
 */
async function createHttpServer(app, port) {
  const httpServer = http.createServer(app);
  await new Promise((resolve) => {
    httpServer.listen(port, () => resolve());
  })

  let addr = httpServer.address();
  addr = fixServerAddress(addr);

  console.log('[ProxyMock] HTTP Server is listening on: http://%s:%s', addr.ip, addr.port);
  httpLogger.info('[ProxyMock] HTTP Server is listening on: http://%s:%s', addr.ip, addr.port);

  return addr;
}

/**
 * 创建 HTTPS Server
 * @param {Express} app
 * @param {Integer} port
 * @param {Object} ca
 * @return {Object}
 */
async function createHttpsServer(app, port, { key, cert }) {
  const options = {
    key: key || fs.readFileSync(path.resolve(__dirname, '../../cert/server.pem')),
    cert: cert || fs.readFileSync(path.resolve(__dirname, '../../cert/server.crt'))
  };

  const httpsServer = https.createServer(options, app);
  await new Promise((resolve) => {
    httpsServer.listen(port, () => resolve());
  });

  let addr = httpsServer.address();
  addr = fixServerAddress(addr);

  console.log('[ProxyMock] HTTPS Server is listening on: https://%s:%s', addr.ip, addr.port);
  httpsLogger.info('[ProxyMock] HTTPS Server is listening on: https://%s:%s', addr.ip, addr.port);

  return addr;
}

async function applyMatchedRule(matchedRule, req, res, data = '') {
  if (_.isFunction(matchedRule)) {
    const matchedData = await matchedRule(req, res, data);
    end(matchedData, res);
  }
  else {
    end(matchedRule, res);
  }
}

function end(data, res) {
  if (_.isPlainObject(data)) {
    res.json(data);
  }
  else {
    res.end(data);
  }
}

module.exports = {
  createWebServers,
  createExpress,
  createHttpServer,
  createHttpsServer
};
