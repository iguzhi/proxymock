const { bufferToChunks } = require('../utils/buffer');
const { createConnection, closeSocket, tryWrite } = require('../utils/socket');
const { getConnectionEstablishedPacket } = require('../utils/http');

async function handleHTTPS(clientSocket, { host, ip, port , chunkSize }) {
	// -- ServerSocket --
  // 转发到https服务器
	const serverSocket = await createConnection({ host: host || ip, port });

	const close = () => {
		closeSocket(clientSocket);
		closeSocket(serverSocket);
	};

	serverSocket.on('data', data => {
		tryWrite(clientSocket, data, close);
	});

	serverSocket.on('end', () => {
		close();
	});

	serverSocket.on('error', error => {
		close(error);
	});

	// -- clientSocket --

	clientSocket.once('data', clientHello => {
		const chunks = bufferToChunks(clientHello, chunkSize || 100);
		for (const chunk of chunks) {
			tryWrite(serverSocket, chunk, close);
		}

		clientSocket.on('data', data => {
			tryWrite(serverSocket, data, close);
		});
	});

	clientSocket.on('end', () => {
		close();
	});

	clientSocket.on('error', error => {
		close(error);
	});

	tryWrite(clientSocket, getConnectionEstablishedPacket(), close);
	clientSocket.resume();
}

module.exports = handleHTTPS;
