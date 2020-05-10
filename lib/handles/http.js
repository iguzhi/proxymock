const { createConnection, closeSocket, tryWrite } = require('../utils/socket');
const { interceptRequest } = require('../utils/http');
const { getLogger } = require('../../utils/logger');
const logger = getLogger('http');

async function handleHTTP(clientSocket, { host, ip, port }, firstChunk) {
	// -- ServerSocket --
  // 转发到http服务器
	const serverSocket = await createConnection({ host: host || ip, port });

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

module.exports = handleHTTP;
