const http = require('http');
const https = require('https');
const fs = require('fs');
const net = require('net');
const url = require('url');
const path = require('path');

function request(cReq, cRes) {
  const u = url.parse(cReq.url);
  console.log('11111', u)
  const options = {
    hostname : u.hostname, 
    port     : u.port || 80,
    path     : u.path,       
    method   : cReq.method,
    headers  : cReq.headers
  };

  const pReq = http.request(options, function(pRes) {
    console.log('22222')
    cRes.writeHead(pRes.statusCode, pRes.headers);
    pRes.pipe(cRes);
  })
  .on('error', function(e) {
    console.log('33333', e)
    cRes.end();
  });

  cReq.pipe(pReq);
}

function connect(cReq, cSock) {
  const u = url.parse('http://' + cReq.url);
  console.log('connect', u)
  const pSock = net.connect(u.port, u.hostname, function() {
    cSock.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    pSock.pipe(cSock);
  })
  .on('error', function(e) {
    console.log('44444', e)
    cSock.end();
  });

  cSock.pipe(pSock);
}

const options = {
  key  : fs.readFileSync(path.join(__dirname, '../../cert/private.pem')),
  cert : fs.readFileSync(path.join(__dirname, '../../cert/public.crt'))
};

function createServer(port) {
  https.createServer(options)
  .on('request', request)
  .on('connect', connect)
  .listen(port, '0.0.0.0');
}

module.exports = createServer;