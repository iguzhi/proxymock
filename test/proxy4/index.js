var http = require("http");
var https = require("https");
var url = require("url");
var net = require("net");
var qs = require("querystring");
const tls = require('tls');
const fs = require('fs');
const path = require('path');

const options = {
  // Necessary only if the server requires client certificate authentication.
  key: fs.readFileSync(path.join(__dirname, '../../cert/private.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../../cert/public.crt')),
};
//用node中的http创建服务器 并传入两个形参
http.createServer(options, function(req , res) {
  //设置请求头 允许所有域名访问 解决跨域
  res.setHeader("Access-Control-Allow-Origin" , "*");
  console.log('[http] request url', req.method, req.url)
  // //获取地址中的参数
  // var query = url.parse(req.url).query;
    
  // //用qs模块的方法 把地址中的参数转变成对象 方便获取
  // var queryObj = qs.parse(query);
  // //获取前端传来的myUrl=后面的内容　　GET方式传入的数据
  // var myUrl = queryObj.myUrl;
  //创建变量保存请求到的数据
  var data = "";
  // console.log('[http] queryObj', queryObj)

  res.end(JSON.stringify({
    a: 11,
    b: 22
  }))
  return
    
  //开始请求数据 http.get()方法
  http.get(req.url,function (request) {
    //监听myUrl地址的请求过程
    //设置编码格式
    request.setEncoding("utf8");
      
    //数据传输过程中会不断触发data信号
    request.on("data", function (response) {
      data += response;
    });
    
    //当数据传输结束触发end
    request.on("end" , function () {
      //把data数据返回前端
      res.end(data);
    });
  })
  .on("error" , function () {
      console.log("请求myUrl地址出错！");
  });
})
.listen(8000, '127.0.0.1', function(err){
    if(!err){
        console.log("服务器启动成功，正在监听8000...");
    }
})
.on("connection", function (socket) {
  // console.log("connection ");
})
.on('connect', function (cReq, cSock) {
  console.log("111");
  console.log("connect " + cReq.url);
  connect(cReq, cSock);
})
// .on('request', function (cReq, response ) {
//   console.log("222");
//   // console.log("receive request: ", cReq, response );
// });

function connect(cReq, cSock) {
  // console.log(JSON.stringify(cReq))
  var u = url.parse('http://' + cReq.url);
  // var data = '';
  var pSock = net.connect(u.port, u.hostname, function () {
      cSock.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      pSock.pipe(cSock);
  })
  .on('error', function (e) {
      cSock.end();
  })
  // .on('data', trunk => {
  //   console.log("4444");
  //   data += trunk
	// 	// console.log(trunk.toString('base64'))
  // })
  .on('end', data => {
		// console.log('end: ', data)
	});
  cSock.pipe(pSock);
} 