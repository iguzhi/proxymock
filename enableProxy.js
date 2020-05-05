const { enableGlobalProxy } = require('./systemProxyMgr');

const data = enableGlobalProxy('127.0.0.1', '1080');
console.log(data.status === 0 ? '启动代理成功(127.0.0.1:1080)' : data.stderr);

