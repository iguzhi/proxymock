const net = require('net');
const express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
const http = require('http');
const https = require('https');
const dns = require('dns');
const fs = require('fs');
const path = require('path');
const  { URL } = require('url');
const axios = require('axios');
const querystring = require('querystring');
const { isHTTPRequest, isConnectMethod } = require('./utils');
const { getLogger } = require('../../utils/logger');
const httpLogger = getLogger('http');
const httpsLogger = getLogger('https');
const proxyLogger = getLogger('proxy');

/**
 * create server
 * @param {Integer} port 
 * @param {Object} router 
 * {
 *    'POST /user': function(req, res, next) {},
 *    'GET /session': function(req, res, next) {}
 * }
 */
function createServer({ httpPort = 7001, httpsPort = 7002, router = {} }, callback) {
  const app = express();
  app.use(cors({
    origin: '*' //允许访问的目标站点
  }));

  //解析application/json
  app.use(bodyParser.json());

  //解析application/x-www-form-urlencoded
  // app.use(bodyParser.urlencoded());

  const options = {
    key: fs.readFileSync(path.resolve(__dirname, '../../cert/server.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, '../../cert/server.crt'))
  };
  const httpsServer = https.createServer(options, app);
  const httpServer = http.createServer(app);

  app.use(async (req, res, next) => {
    console.log(666666666, req.url, req.headers.host)
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

    // const options = {
    //   baseURL: req.baseUrl || (req.protocol + '://' + req.hostname),
    //   method: req.method,
    //   url: req.path,
    //   params: req.params,
    //   data: req.method === 'POST' ? req.body : req.query
    // };

    // console.log(options)

    // let result;
    
    // try {
    //   result = await axios(options);
    // }
    // catch(e) {
    //   throw e
    // }
    

    // console.log(result.data);
    // res.json(result.data);

    // const query = querystring.stringify(req.query);
    const logger = req.secure ? httpsLogger : httpLogger;
    const options = {
      hostname: req.hostname,
      port: req.secure ? 443: 80,
      path: req.url,
      method: req.method,
      // headers: req.headers
    };
    logger.debug(options)
    let data = '';
    const r = (req.secure ? https : http).request(options, function (rsp) {
      //监听myUrl地址的请求过程
      //设置编码格式
      rsp.setEncoding("utf8");
        
      //数据传输过程中会不断触发data信号
      rsp.on("data", function (trunk) {
        data += trunk;
      });
      
      //当数据传输结束触发end
      rsp.on("end" , function () {
        logger.debug(`[${req.protocol} end]`, data);
        //把data数据返回前端
        res.end(data);
      });
    })
    .on("error" , function () {
      logger.error(`[${req.protocol} ${req.method}]请求${req.hostname + req.url}地址出错！`, req.method === 'POST' ? req.body : '');
    })
    if (req.method === 'POST') {
      r.write(JSON.stringify(req.body));
    }
    r.end();
  })

  // for (let key in router) {
  //   const route = router[key];
  //   const list = key.split(/\s/);
  //   const method = list[0].toLowerCase();
  //   const url = list[1];
  //   console.log('register route on server', method, url, route)
  //   app[method] && app[method](url, route);
  // }

  httpServer.listen(httpPort, () => console.log('[ProxyMock] HTTP Server is listening on: http://localhost:%s', httpPort));
  httpsServer.listen(httpsPort, () => console.log('[ProxyMock] HTTPS Server is listening on: https://localhost:%s', httpsPort));


  net.createServer(function(socket){
    // socket.setEncoding('hex')
    socket.resume();
    socket.once('data', function(buf){
      // console.log(buf[0]);
      // https数据流的第一位是十六进制“16”，转换成十进制就是22
      // var address = buf[0] == 67 ? httpsPort : httpPort;
      socket.pause();
      const firstChunk = buf.toString();
      
      const isHttpReq = isHTTPRequest(firstChunk);
      if (!isHttpReq) { // 非http和https请求
        closeSocket(socket);
        return;
      }

      // proxyLogger.debug(`[HTTP firstChunk] ${firstChunk}`);
      // const firstLine = firstChunk.toString().split('\r\n')[0];
      // proxyLogger.debug(`[HTTP firstLine] ${firstLine}`);
      // const requestUrl = firstLine.split(/\s+/)[1];
      // proxyLogger.debug(`[HTTP requestUrl] ${requestUrl}`);
      // console.log(`[HTTP requestUrl] ${requestUrl}`)
      // const url = new URL(requestUrl);

      // const host = url.hostname;
      // const port = url.port || 80;
      // console.log(`[HTTP host] ${host}`)
      
      // dns.resolve(host, "A", (err, addresses) => {
      //   if (err) {
      //     return
      //   }
      //   const ip = addresses[0];

      //   proxyLogger.debug(`[HTTP ip] ${ip}`);

      //   console.log(`[HTTP ip] ${ip}`)
    
        
      // });
      var address = isHttpReq && isConnectMethod(firstChunk) ? httpsPort : httpPort;
      if (!firstChunk.match(/(qq|live|googleapis|google|msecnd|microsoft|bdstatic|baidustatic|cnzz)\.(com|cn|net)/)) {
        console.log(firstChunk)
        console.log(address)
      }
      
      //创建一个指向https或http服务器的链接
      var proxy = net.createConnection({ port: address, host: '127.0.0.1' }, function() {
        // proxy.setEncoding('utf8')
        socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
        //反向代理的过程，tcp接受的数据交给代理链接，代理链接服务器端返回数据交由socket返回给客户端
        socket.pipe(proxy).pipe(socket);
      });

      proxy.on('data', data => {
        // console.log(`[proxy] receive from ${url.host} (length: ${data.length})`);
        // console.log('[proxy] receive data: ', data);
      });
      
      proxy.on('error', function(err) {
        console.log(err);
        closeSocket(socket);
        closeSocket(proxy);
      });
      proxy.on('end', function(err) {
        closeSocket(socket);
        closeSocket(proxy);
      });
      
      socket.on('data', data => {
        // console.log(`[socket] receive from ${url.host} (length: ${data.length})`);
        // console.log('[socket] receive data: ', data);
      });
      
      socket.on('error', function(err) {
        console.log(err);
        closeSocket(socket);
        closeSocket(proxy);
      });
      socket.on('end', function(err) {
        closeSocket(socket);
        closeSocket(proxy);
      });
    });

    
  }).listen(8000, () => {
    console.log('proxy2 listen on 8000')
    callback && callback();
  })
  // .on("connection", function (socket) {
  //   console.log('connection');
  // })
}

function closeSocket(socket) {
	socket.removeAllListeners('data');
	socket.removeAllListeners('error');
	socket.end();
}


// function createServer(d, callback) {
//   var server = http.createServer(function(req, res){
//     console.log(111111111)
//     // conosole.log(req)
//     // console.log('[http start]', req.method, req.url)
//     // var url = require('url').parse(request.url);
//     // var data = '';
//     const options = {
//       hostname: url.hostname,
//       port: url.port,
//       path: url.pathname,
//       method: req.method,
//       // headers: {
//       //   'Content-Type': 'application/x-www-form-urlencoded',
//       //   'Content-Length': Buffer.byteLength(postData)
//       // }
//     };
//     var r = http.request(options, function (rsp) {
//       //监听myUrl地址的请求过程
//       //设置编码格式
//       rsp.setEncoding("utf8");
        
//       //数据传输过程中会不断触发data信号
//       rsp.on("data", function (trunk) {
//         data += trunk;
//       });
      
//       //当数据传输结束触发end
//       rsp.on("end" , function () {
//         console.log('[http end]')
//         //把data数据返回前端
//         res.end(data);
//       });
//     })
//     .on("error" , function () {
//         console.log("[http]请求myUrl地址出错！");
//     })
//     if (req.method === 'POST') {
//       r.write({});
//     }
//     r.end();
//   })
//   .listen(httpPort);
  
//   var options = {
//     key: fs.readFileSync(path.join(__dirname, '../../cert/private.pem')),
//     cert: fs.readFileSync(path.join(__dirname, '../../cert/public.crt'))
//   };
  
//   var sserver = https.createServer(options, function(req, res){
//     console.log(22222222222)
//     var url = 'https://' + req.headers.host + req.url;
//     console.log('[https start]', url)
//     const options = {
//       hostname: req.headers.host,
//       port: 443,
//       path: req.url,
//       method: req.method,
//       // key: fs.readFileSync('test/fixtures/keys/agent2-key.pem'),
//       // cert: fs.readFileSync('test/fixtures/keys/agent2-cert.pem'),
//       agent: false
//     };
//     var data = '';
//     https.request(options, function (rsp) {
//       //监听myUrl地址的请求过程
//       //设置编码格式
//       rsp.setEncoding("utf8");
        
//       //数据传输过程中会不断触发data信号
//       rsp.on("data", function (trunk) {
//         data += trunk;
//       });
      
//       //当数据传输结束触发end
//       rsp.on("end" , function () {
//         console.log('[https end]')
//         //把data数据返回前端
//         res.end(data);
//       });
//     })
//     .on("error" , function () {
//         console.log("[https]请求myUrl地址出错！");
//     })
//     .end();;
//   })
//   .listen(httpsPort);
  
//   net.createServer(function(socket){
//     socket.once('data', function(buf){
     
//      // https数据流的第一位是十六进制“16”，转换成十进制就是22
//      var isFF = isHTTPRequest(buf.toString())
//      var address = isFF ? httpPort : httpsPort;
//      //创建一个指向https或http服务器的链接
//      console.log(address, isFF);
//      var proxy = net.createConnection(address, function() {
//       // proxy.write(buf);
//       socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
//       //反向代理的过程，tcp接受的数据交给代理链接，代理链接服务器端返回数据交由socket返回给客户端
//       socket.pipe(proxy).pipe(socket);
//      });
     
     
//      proxy.on('error', function(err) {
//       console.log(err);
//      });
//     });
    
//     socket.on('error', function(err) {
//      console.log(err);
//     });
//    }).listen(8000, () => {
//         console.log('proxy2 listen on 8000')
//         callback && callback();
//       })
// }


module.exports = createServer;