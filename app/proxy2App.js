const createServer = require('../lib/proxy2');
const { setProxy, unsetProxy } = require('../lib/proxy/utils/systemProxy');
createServer({
  httpPort: 8001, // optional, default 80
  httpsPort: 8002, // optional, default 443
  router: {
    'GET /data/one': (req, res, next) => {
      res.json({ a: 1 });
    },
    'GET /data': (req, res, next) => {
      res.json({ a: 1, b: 2, c: 3 });
    },
    'POST /data': (req, res, next) => {
      res.json({ a: 4, b: 5, c: 6 });
    },
    'GET /data/1.json': (req, res, next) => {
      res.json({ a: 7, b: 8, c: 9 });
    },
  },
},
() => {
  setProxy('127.0.0.1', 8000)
});

process.on('SIGINT', function () {
  unsetProxy();
  process.exit();
});