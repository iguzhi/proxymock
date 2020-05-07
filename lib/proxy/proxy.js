// // module.exports = function(https) { return https ? require('./httpsproxy') : require('./httpproxy') }

// var httpProxy = require('http-proxy');
// // Error example


// function createServer(port) {
//   //
//   // Http Proxy Server with bad target
//   //
//   var proxy = httpProxy.createServer({
//     target:'http://localhost:9005'
//   });

//   proxy.listen(port);

//   //
//   // Listen for the `error` event on `proxy`.
//   proxy.on('error', function (err, req, res) {
//     res.writeHead(500, {
//       'Content-Type': 'text/plain'
//     });

//     res.end('Something went wrong. And we are reporting a custom error message.');
//   });

//   //
//   // Listen for the `proxyRes` event on `proxy`.
//   //
//   proxy.on('proxyRes', function (proxyRes, req, res) {
//     console.log('RAW Response from the target', JSON.stringify(proxyRes.headers, true, 2));
//   });

//   //
//   // Listen for the `open` event on `proxy`.
//   //
//   proxy.on('open', function (proxySocket) {
//     // listen for messages coming FROM the target here
//     proxySocket.on('data', (data) => console.log(data));
//   });

//   //
//   // Listen for the `close` event on `proxy`.
//   //
//   proxy.on('close', function (res, socket, head) {
//     // view disconnected websocket connections
//     console.log('Client disconnected');
//   });
// }

// module.exports = createServer;

var http = require('http'),
    httpProxy = require('http-proxy');

function createServer(port) {
  //
  // Create a proxy server with custom application logic
  //
  var proxy = httpProxy.createProxyServer({});

  //
  // Create your custom server and just call `proxy.web()` to proxy
  // a web request to the target passed in the options
  // also you can use `proxy.ws()` to proxy a websockets request
  //
  var server = http.createServer(function(req, res) {
    // You can define here your custom logic to handle the request
    // and then proxy the request.
    console.log('aaaaaaaaaa')
    proxy.web(req, res, { target: 'http://127.0.0.1:5050' });
  });

  console.log("listening on port ", port)
  server.listen(port);
}

module.exports = createServer