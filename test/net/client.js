// 创建socket客户端 client.js
const net = require('net');
const client = net.connect({port: 4002, ip: '127.0.0.1'});
client.on('connect', () => {
  client.write('data from client');
});
client.on('data', (chunk) => {
  console.log(chunk.toString());
});

process.on('SIGINT', () => {
  client.end();
  client.destroy();
});