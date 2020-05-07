// 创建socket服务器 server.js
const net = require('net')
const server = net.createServer();
server.on('connection', (socket) => {
  socket.pipe(process.stdout);
  socket.write('data from server');
});
server.listen(4002, '127.0.0.1', () => {
  console.log(`server is on ${JSON.stringify(server.address())}`);
});

process.on('SIGINT', () => {
  server.close();
});