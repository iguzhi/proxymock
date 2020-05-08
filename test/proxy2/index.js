require('../../app/proxy2App')

// 问题: 会拦截自定义hosts文件中配置域名的所有请求, 如何放过配置域名的某些请求?
process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err)
});

process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection', err)
});