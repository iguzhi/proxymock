exports.loggerConf = { // 日志配置
  active: true,
  defaultLevel: 'info',
  level: {
    default: 'info', // 默认
    http: 'info',
    https: 'info',
    request: 'info',
    proxy: 'info',
    dns: 'info',
    socket: 'info',
  }
};
