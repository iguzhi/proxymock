let net = require('net');
const { setProxy, unsetProxy } = require('../../lib/proxy/utils/systemProxy');
let client 
let server = net.createServer(function (socket) {
    console.log("客户端已经连接");
    socket.setEncoding('utf8');
    socket.on('data', function (data) {
        console.log("已接收客户端发送的数据:%s", data);
        socket.write('服务器:' + data);
    })
    socket.on('error', function (err) {
        console.log('与客户端通信过程中发生了错误，错误编码为%s', err.code);
        socket.destroy();
    });
    socket.on('end', function (err) {
        console.log('客户端已经关闭连接');
        socket.destroy();
    });
    socket.on('close', function (hasError) {
        console.log(hasError ? '异常关闭' : '正常关闭');
    });
});
server.listen(8000, '127.0.0.1', function () {
    setProxy('127.0.0.1', 8000)
    
    client = new net.Socket();
    client.setEncoding('utf8');
    client.connect(8000, '127.0.0.1', function () {
        console.log('客户端已连接');
        client.write('hello');
        setTimeout(function () {
            client.end('byebye');
        }, 5000);
        // const fetch = require('node-fetch')

        // fetch('https://api.github.com/users/github')
        // .then(res => res.json())
        // .then(json => client.write(JSON.stringify(json)));
    });
    client.on('data', function (data) {
        console.log('已经接收到客户端发过来的数据:%s', data);
    });
    client.on('error', function (err) {
        console.log('与服务器通信过程中发生了错误，错误编码为%s', err.code);
        client.destroy();
    });

});


process.on('SIGINT', function () {
    unsetProxy();
    process.exit();
  });