const { URL } = require('url');
const { bufferToChunks } = require('../utils/buffer');
const { createConnection, closeSocket, tryWrite } = require('../utils/socket');
const HTTPResponse = require('../http/response');

async function handleHTTPS(clientSocket, firstChunk, proxy) {
	const firstLine = firstChunk.toString().split('\r\n')[0];
	const requestUrl = `https://${firstLine.split(/\s+/)[1]}`;
	const url = new URL(requestUrl);

	const host = url.hostname;
	const port = url.port || 443;

	console.debug(`[HTTPS REQUEST] ${url.host}`);

	// -- ServerSocket --

	const serverSocket = await createConnection({host, port}, proxy.dns);

	const close = () => {
		closeSocket(clientSocket);
		closeSocket(serverSocket);
	};

	serverSocket.on('data', data => {
		console.debug(`[HTTPS] receive from ${url.host} (length: ${data.length})`);
		tryWrite(clientSocket, data, close);
	});

	serverSocket.on('end', () => {
		console.debug(`[HTTPS END] server ended ${url.host}`);
		close();
	});

	serverSocket.on('error', error => {
		console.debug(`[HTTPS ERROR] server error ${error}`);
		close(error);
	});

	// -- clientSocket --

	clientSocket.once('data', clientHello => {
		const chunks = bufferToChunks(clientHello, proxy.config.clientHelloMTU);
		for (const chunk of chunks) {
			console.debug(`[HTTPS HELLO] ${url.host} (length: ${chunk.length})`);
			tryWrite(serverSocket, chunk, close);
		}

		clientSocket.on('data', data => {
			console.debug(`[HTTPS] send to ${url.host} (length: ${data.length})`);
			tryWrite(serverSocket, data, close);
		});
	});

	clientSocket.on('end', () => {
		console.debug(`[HTTPS END] client ended ${url.host}`);
		close();
	});

	clientSocket.on('error', error => {
		console.debug(`[HTTPS ERROR] client error ${error}`);
		close(error);
	});

	tryWrite(clientSocket, getConnectionEstablishedPacket(), close);
	clientSocket.resume();
}

function getConnectionEstablishedPacket() {
	const packet = new HTTPResponse();
	packet.statusCode = 200;
	packet.statusMessgae = 'Connection Established';
	return packet.toString();
}

module.exports = handleHTTPS;
