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
