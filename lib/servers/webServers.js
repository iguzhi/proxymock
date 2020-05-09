const express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const _ = require('lodash');
const portfinder = require('portfinder');
const { getLogger } = require('../../utils/logger');
const httpLogger = getLogger('http');
const httpsLogger = getLogger('https');

const requiredHeaderFields = [
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
  'Cookie',
  'Origin',
  'Referer'
];

function filterHeaders(inputHeader) {
  const header = {};
  requiredHeaderFields.forEach(field => {
    const value = inputHeader[field.toLowerCase()];
    if (value) {
      header[field] = value;
    }
  });
  return header;
}

/**
 * 启动web server
 * @param {Object} ca { key: '', cert: ''  }
 * @param {Object} router { 'GET https://a.com/b?t=123': { a: 1, b: 2}, 'POST http://b.com/c': (req, res) => {} }
 */
async function createServer(ca, router) {
  const app = initExpress(router);
  const httpPort = await portfinder.getPortPromise({ startPort: 8000, stopPort: 9999 });
  await initHttpServer(app, httpPort);
  const httpsPort = await portfinder.getPortPromise({ startPort: 8000, stopPort: 9999 });
  await initHttpsServer(app, httpsPort, ca || {});

  return { httpPort, httpsPort };
}

// 创建 Express App
function initExpress(router = {}) {
  const app = express();
  app.use(cors({
    origin: '*'
  }));

  //解析application/json
  app.use(bodyParser.json());

  app.use(async (req, res) => {
    console.log(666666666, req.url, req.headers.host)
    const logger = req.secure ? httpsLogger : httpLogger;

    const headers = filterHeaders(req.headers);
    const urlObj = url.parse(req.url);
    const reqUrl = req.protocol + '://' + req.hostname + req.path;
    const matchKey = req.method + ' ' + reqUrl;
    const matchedRoute = router[matchKey]; // if function: (req, res, data) => {...}
    logger.debug('url: ', reqUrl);
    logger.debug('matchKey: ', matchKey);
    logger.debug('matchedRoute: ', matchedRoute);
    logger.debug('urlObj: ', urlObj);
    const options = {
      hostname: req.hostname,
      port: req.secure ? 443 : 80,
      path: req.url,
      method: req.method,
      headers
    };

    let data = '';
    const r = (req.secure ? https : http).request(options, async rsp => {
      // 设置编码格式
      // rsp.setEncoding("utf8");
      // 还原response headers
      const rspHeaders = rsp.headers;
      for (let field in rspHeaders) {
        res.setHeader(field, rspHeaders[field]);
      }
      
      //数据传输过程中会不断触发data信号
      rsp.on("data", trunk => {
        data += trunk;
      });
      
      // 当数据传输结束触发end
      rsp.on("end" , async () => {
        // logger.debug(`[${req.protocol} end]`, data);
        // logger.debug('req.params', req.params);
        // logger.debug('req.query', req.query);
        // logger.debug('req.body', req.body);
        // logger.debug('req.url', req.url);
        // // console.log('req.headers', req.headers);
        // logger.debug('req.baseUrl', req.baseUrl);
        // logger.debug('req.path', req.path);
        // logger.debug('req.originalUrl', req.originalUrl);
        // logger.debug('req.protocol', req.protocol);
        // logger.debug('req.hostname', req.hostname);
        // logger.debug('req.secure', req.secure);
        // logger.debug('req.headers', req.headers);
        if (matchedRoute) {
          if (_.isFunction(matchedRoute)) {
            const matchedData = await matchedRoute(req, res, data);
            end(matchedData, res);
          }
          else {
            end(matchedRoute, res);
          }
          return;
        }
        // 把data数据返回前端
        res.end(data);
      });
    })
    .on("error" , () => {
      logger.error('[%s]%s %s!', req.protocol, req.method, req.hostname + req.url, req.body);
    })
    if (req.method === 'POST' || req.method === 'PUT') {
      req.body && r.write(JSON.stringify(req.body));
    }
    r.end();
  })

  return app;
}

// 创建 HTTP Server
async function initHttpServer(app, port) {
  const httpServer = http.createServer(app);
  
  await new Promise((resolve) => {
    httpServer.listen(port, () => resolve());
  })
  console.log('[ProxyMock] HTTP Server is listening on: http://127.0.0.1:%s', port);
}

// 创建 HTTPS Server
async function initHttpsServer(app, port, { key, cert }) {
  const options = {
    key: key || fs.readFileSync(path.resolve(__dirname, '../../cert/server.pem')),
    cert: cert || fs.readFileSync(path.resolve(__dirname, '../../cert/server.crt'))
  };
  const httpsServer = https.createServer(options, app);
  await new Promise((resolve) => {
    httpsServer.listen(port, () => resolve());
  });
  console.log('[ProxyMock] HTTPS Server is listening on: https://127.0.0.1:%s', port);
}

function end(data, res) {
  if (_.isPlainObject(data)) {
    res.json(data);
  }
  else {
    res.end(data);
  }
}

module.exports = createServer;