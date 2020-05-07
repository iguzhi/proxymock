const { proxymock } = require('../../index');
const path = require('path');

proxymock({
  // httpPort: 80, // optional, default 80
  // httpsPort: 443, // optional, default 443
  router: {
    'USE /': (req, res, next) => {
      console.log(111222)
      res.json({ a: 111222 });
    },
    'GET /bars/one': (req, res, next) => {
      res.json({ a: 1 });
    },
    'GET /bars': (req, res, next) => {
      res.json({ a: 1, b: 2, c: 3 });
    },
    'POST /bars': (req, res, next) => {
      res.json({ a: 4, b: 5, c: 6 });
    },
    'GET /bars/1.json': (req, res, next) => {
      res.json({ a: 7, b: 8, c: 9 });
    },
  },
});

// 问题: 会拦截自定义hosts文件中配置域名的所有请求, 如何放过配置域名的某些请求?