exports.loggerConf = { // 日志配置
  active: true,
  defaultLevel: 'info',
  level: {
    default: 'info', // 默认
    http: 'error',
    https: 'error',
    request: 'error',
    proxy: 'error',
    dns: 'error',
    socket: 'error',
  }
};
