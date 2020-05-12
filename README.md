# proxymock
类似fiddler的编程式代理mock工具

启用了3个端口, 代理服务器转发到http server和https server, 最终在express中集中处理

实际上只需要2个端口就可以实现同样的功能, 但3个端口可以做的事情更多, 比如http Server和https Server可以和proxy Server部署在不同的机器上, 实现Proxy Server向不同机器转发请求

## 如何使用

* `yarn add node-proxymock` 或 `npm install node-proxymock --save`

* `
  const { proxyMock } = require('node-proxymock');

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
      }
    },
    setSystemProxy: true, // 是否设置系统代理, 默认值 false
    logLevelConf: 'info', // 日志级别, 默认值级别 info
    noCache: true // 禁用缓存, 默认值 true
  });
`

## 测试

请参考test目录, 运行 `yarn test` 或者 `npm run test`

## response header 附加字段说明

`Prxoy-Engine: ProxyMock` 表示当前资源是经过ProxyMock转发而来

`Prxoy-Phase-Flag: ^` 表示当前资源由命中规则的数据直接返回, 没有向远程服务器发送真实请求; 若命中规则是函数则该函数没有第三个参数. 请注意与下一条描述的差异点

`Prxoy-Phase-Flag: $` 表示当前资源虽然由命中规则返回, 但是在向远程服务器发送真实请求返回真实数据后再返回命中规则的返回的数据; 如果命中规则是个函数, 那么该函数的第三个参数是真实请求返回的数据

## 参考以下分享、感谢作者

[CDN的基本工作过程](https://www.cnblogs.com/xuan52rock/p/6844818.html)

[浅谈一个网页打开的全过程（涉及DNS、CDN、Nginx负载均衡等）](https://www.cnblogs.com/xuan52rock/p/6845637.html)

[使用程序修改系统(IE)代理设置](https://www.cnblogs.com/xuan52rock/p/6902177.html)

[Fiddler工作原理](https://www.cnblogs.com/xuan52rock/p/6902194.html)

[HTTP协议 (一) HTTP协议详解](http://www.cnblogs.com/TankXiao/archive/2012/02/13/2342672.html)

[HTTP协议 (二) 基本认证](http://www.cnblogs.com/TankXiao/archive/2012/09/26/2695955.html)

[HTTP协议 (三) 压缩](http://www.cnblogs.com/TankXiao/archive/2012/11/13/2749055.html)

[HTTP协议 (四) 缓存](http://www.cnblogs.com/TankXiao/archive/2012/11/28/2793365.html)

[HTTP协议 (五) 代理](http://www.cnblogs.com/TankXiao/archive/2012/12/12/2794160.html)

[HTTP协议 (六) 状态码详解](http://www.cnblogs.com/TankXiao/archive/2013/01/08/2818542.html)

[HTTP协议 (七) Cookie](http://www.cnblogs.com/TankXiao/archive/2013/04/15/2848906.html)

[利用nodejs搭建 https 代理服务器并实现中间人攻击](https://juejin.im/post/5cce881ef265da036902a934)

[编写了一个HTTP高匿代理](https://blog.csdn.net/laotse/article/details/5903651)

[用c#编写socks代理服务器，大白话细述协议的最重要部分。](https://blog.csdn.net/laotse/article/details/6296573)

[加密的TCP通讯全过程](https://blog.csdn.net/laotse/article/details/5910378)

[c#做端口转发程序支持正向连接和反向链接](https://blog.csdn.net/laotse/article/details/5874778)
