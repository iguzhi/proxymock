const { disableGlobalProxy } = require('./systemProxyMgr');

const data = disableGlobalProxy();
console.log(data.status === 0 ? '关闭代理成功' : data.stderr);
