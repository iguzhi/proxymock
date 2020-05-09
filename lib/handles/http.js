const { createConnection, closeSocket, tryWrite } = require('../utils/socket');
const { interceptRequest } = require('../utils/http');

async function handleHTTP(clientSocket, { host, ip, port }, firstChunk) {
	// -- ServerSocket --
  // 转发到http服务器
	const serverSocket = await createConnection({ host: host || ip, port });

	const close = () => {
		closeSocket(clientSocket);
		closeSocket(serverSocket);
	};

	tryWrite(serverSocket, interceptRequest(firstChunk), close);

	serverSocket.on('data', data => {
		tryWrite(clientSocket, data, close);
	});

	serverSocket.on('error', error => {
		close(error);
	});

	serverSocket.on('end', () => {
		close();
	});

	// -- clientSocket --

	clientSocket.on('data', data => {
		tryWrite(serverSocket, interceptRequest(data), close);
	});

	clientSocket.on('end', () => {
		close();
	});

	clientSocket.resume();
}

module.exports = handleHTTP;
