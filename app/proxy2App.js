const createServer = require('../lib/proxy2');
const { setProxy, unsetProxy } = require('../lib/proxy/utils/systemProxy');
createServer(() => {
  setProxy('127.0.0.1', 8000)
});

process.on('SIGINT', function () {
  unsetProxy();
  process.exit();
});