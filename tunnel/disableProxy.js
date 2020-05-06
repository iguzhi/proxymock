const { unsetProxy } = require('./systemProxy');

const data = unsetProxy();
console.log(data.status === 0 ? '关闭代理成功' : data.stderr);
