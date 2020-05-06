const { setProxy } = require('./systemProxy');
const portfinder = require('portfinder');

portfinder.getPortPromise({
  port: 8000,    // minimum port
  stopPort: 9999 // maximum port
})
.then((port) => {
  //
  // `port` is guaranteed to be a free port
  // in this scope.
  //
  const result = setProxy('127.0.0.1', port);
  console.log(result.status === 0 ? `启动代理成功(127.0.0.1:${port})` : result.stderr);
})
.catch((err) => {
  //
  // Could not get a free port, `err` contains the reason.
  //
  console.error('[Error PortFinder]', err);
});
