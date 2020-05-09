exports.loggerConf = { // 日志配置
  active: true,
  defaultLevel: 'info',
  level: {
    default: 'info', // 默认
    http: 'debug',
    https: 'debug',
    request: 'debug',
    proxy: 'debug',
    dns: 'debug',
    socket: 'debug',
  }
};

exports.caConf = {
  key: '',
  cert: ''
};

exports.proxyServerConf = {
  httpServer: {
    // ip: '127.0.0.1',
    // port: 80
  },
  httpsServer: {
    // ip: '127.0.0.1',
    // port: 443
  },
  // ip: '127.0.0.1',
  // port: 8000,
  setSystemProxy: true
};
