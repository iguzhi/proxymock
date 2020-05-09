const proxyMock = require('../index');

proxyMock({
  rules: {
    'GET http://e.iguzhi.com/lib/c.json': async(req, res, rawData) => {
      return {
        a: 5,
        b: 6
      }
    },
    'GET http://f.iguzhi.com/api/d.json': async(req, res, rawData) => {
      await new Promise((resolve) => setTimeout(() => resolve(), 3000))
      res.json([{a:23},'ff', [24.4,22]])
    },
    'GET http://g.iguzhi.com/api/s.json': {
      a: 1,
      b: 2
    },
    'POST https://test.abc.com/api/mini/go.do': async(req, res, rawData) => {
      return req.body;
    }
  },
  // setSystemProxy: true // 是否设置系统代理
});

process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err)
});

process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection', err)
});
