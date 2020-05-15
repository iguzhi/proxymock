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
    'GET https://www.jb51.net/article/1353101.htm': (req, res, rawData) => {
      return `
        <html>
          <title>Hello ProxyMock</title>
          <body>类似fiddler的编程式代理mock工具</body>
        </html>
      `
    },
    // '^ POST https://a.iguzhi.com/pmp.gif': { b: 55556666 },
    'GET https://i.baidu.com/map.json': (req, res, rawData) => {
      return rawData;
    },
    'GET https://www.jb51.net/jslib/syntaxhighlighter/scripts/shCore.js': (req, res, rawData) => {
      return `alert('hello proxymock')`
    },
    '^ GET /iguzhi\.com\/regexp\/test\.json/i': 'test regexp match',
    '^ GET /weather\.[a-z]{2,4}\.cn\/api/': async function(req, res, rawData) {
      await new Promise(resolve => setTimeout(() => resolve(), 3000)); // 模拟请求延迟3秒
      // console.log(req.query)
      if (req.query.type === 'hot') {
        return {
          desc: '艳阳当空、烈日炎炎',
          temperature: 38,
          feeling: 'hot'
        };
      }
      
      if (req.query.type === 'cold') {
        res.json({
          desc: '大雪纷飞、寒风刺骨',
          temperature: -25,
          feeling: 'cold'
        });
      }
    }
  },
  setSystemProxy: false, // 是否设置系统代理, 默认值 false
  logLevel: 'info', // 日志级别, 默认值级别 info
  disableCache: true // 禁用缓存, 默认值 true
});
