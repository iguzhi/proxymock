const chalk = require('chalk');
const { createConnection, closeSocket, tryWrite } = require('../utils/socket');
const { interceptRequest } = require('../utils/http');
const { fixServerAddress } = require('../utils/fix');
const { createHttpServer } = require('../servers/webServers');
const { getLogger } = require('../utils/logger');
const logger = getLogger('http');

let httpServer;

async function handleHTTP(clientSocket, app, firstChunk) {
  if (!httpServer) {
    httpServer = await createHttpServer(app);
    let addr = httpServer.address();
    addr = fixServerAddress(addr);

    // console.info('%s HTTP Server is listening on %s://%s:%s', chalk.green('[proxymock]'), chalk.yellow('http'), chalk.yellow(addr.ip), chalk.yellow(addr.port));
    logger.info('proxymock] HTTP Server is listening on http://%s:%s', addr.ip, addr.port);
  }
  let addr = httpServer.address();
  addr = fixServerAddress(addr);

	// -- ServerSocket --
  // 转发到http服务器
	const serverSocket = await createConnection({ host: addr.ip, port: addr.port });

	const close = (error) => {
		closeSocket(clientSocket);
    closeSocket(serverSocket);
    error && logger.error(error);
	};

	tryWrite(serverSocket, interceptRequest(firstChunk), close);

	// serverSocket.on('data', data => {
	// 	tryWrite(clientSocket, data, close);
	// });

	serverSocket.on('error', error => {
		close(error);
	});

	serverSocket.on('end', () => {
		close();
	});

	// -- clientSocket --

	// clientSocket.on('data', data => {
	// 	tryWrite(serverSocket, interceptRequest(data), close);
	// });

	clientSocket.on('end', () => {
		close();
	});
  clientSocket.pipe(serverSocket).pipe(clientSocket);
	clientSocket.resume();
}

process.on('SIGINT', async () => {
  httpServer && httpServer.close();
});

module.exports = handleHTTP;
