var net = require('net');
var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');

var httpPort = 3345;
var httpsPort = 3346;

function createServer(callback) {
  var server = http.createServer(function(req, res){
    console.log('1111111111111111')
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('hello world!');
  }).listen(httpPort);
  
  var options = {
    key: fs.readFileSync(path.join(__dirname, '../../cert/private.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../../cert/public.crt'))
  };
  
  var sserver = https.createServer(options, function(req, res){
    console.log('22222222222222')
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('secured hello world');
  }).listen(httpsPort);
  
  net.createServer(function(socket){
    socket.once('data', function(buf){
      console.log(buf[0]);
      // https数据流的第一位是十六进制“16”，转换成十进制就是22
      var address = buf[0] === 22 ? httpsPort : httpPort;
      var isHttp = isStartOfHTTPRequest(buf.toString());
      console.log('isHttp: ', isHttp)
      //创建一个指向https或http服务器的链接
      var proxy = net.createConnection(address, function() {
        // proxy.setEncoding('utf8')
        proxy.write(buf);
        //反向代理的过程，tcp接受的数据交给代理链接，代理链接服务器端返回数据交由socket返回给客户端
        socket.pipe(proxy).pipe(socket);
      });
      
      
      proxy.on('error', function(err) {
        console.log(err);
      });
    });
    
    socket.on('error', function(err) {
      console.log(err);
    });
  }).listen(8000, () => {
    console.log('proxy2 listen on 8000')
    callback && callback();
  });
}

const validMethods = [
	'DELETE',
	'GET',
	'HEAD',
	'POST',
	'PUT',
	'CONNECT',
	'OPTIONS',
	'TRACE',
	'COPY',
	'LOCK',
	'MKCOL',
	'MOVE',
	'PROPFIND',
	'PROPPATCH',
	'SEARCH',
	'UNLOCK',
	'BIND',
	'REBIND',
	'UNBIND',
	'ACL',
	'REPORT',
	'MKACTIVITY',
	'CHECKOUT',
	'MERGE',
	'M-SEARCH',
	'NOTIFY',
	'SUBSCRIBE',
	'UNSUBSCRIBE',
	'PATCH',
	'PURGE',
	'MKCALENDAR',
	'LINK',
	'UNLINK'
];

function isStartOfHTTPRequest (rawRequest) {
  // console.log('rawRequest: ', rawRequest)
	// Valid methods (for http request)
	const firstWord = rawRequest.split(/\s+/)[0];
	if (validMethods.includes(firstWord.toUpperCase())) {
		return true;
	}

	// Like HTTP/1.1 (For http response)
	const httpWord = firstWord.split('/')[0];
	if (httpWord.toLowerCase() === 'http') {
		return true;
	}

	return false;
}

module.exports = createServer;