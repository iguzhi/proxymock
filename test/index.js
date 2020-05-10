const { proxyMock } = require('../index');

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
    'GET http://g.iguzhi.com/api/ss.json': {
      a: 33,
      b: 44
    },
    'POST https://test.abc.com/api/mini/go.do': async(req, res, rawData) => {
      return req.body;
    },
    '^ GET http://g.iguzhi.com/api/s.json': { // 以 ^ 开头的规则不会发送真实请求而直接返回这里的mock数据
      a: 1,
      b: 2
    },
    'GET https://www.jb51.net/skin/2019/css/base.css': '123',
    'GET https://www.jb51.net/article/135310.htm': (req, res, rawData) => {
      return `
        <html>
          <title>Hello ProxyMock</title>
          <body>类似fiddler的编程式代理mock工具</body>
        </html>
      `
    },
  },
  setSystemProxy: true // 是否设置系统代理
});
