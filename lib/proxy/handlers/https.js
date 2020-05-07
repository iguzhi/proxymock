const { URL } = require('url');
const { bufferToChunks, decode } = require('../utils/buffer');
const { createConnection, closeSocket, tryWrite } = require('../utils/socket');
const HTTPResponse = require('../http/response');
const { getLogger } = require('../../../utils/logger');
const logger = getLogger('https');

async function handleHTTPS(clientSocket, firstChunk, proxy) {
	logger.debug(`[HTTPS firstChunk] ${firstChunk}`);
	const firstLine = firstChunk.toString().split('\r\n')[0];
	logger.debug(`[HTTPS firstLine] ${firstLine}`);
	const requestUrl = `https://${firstLine.split(/\s+/)[1]}`;
	logger.debug(`[HTTPS requestUrl] ${requestUrl}`);
	const url = new URL(requestUrl);

	const host = url.hostname;
	const port = url.port || 443;

	logger.debug(`[HTTPS REQUEST] ${url.host}`);

	// -- ServerSocket --

	const serverSocket = await createConnection({host, port}, proxy.dns);

	const close = () => {
		closeSocket(clientSocket);
		closeSocket(serverSocket);
	};

	serverSocket.on('data', data => {
		logger.debug(`[HTTPS] receive from ${url.host} (length: ${data.length})`);
		logger.info('[HTTPS] receive data: ', decode(data));
		tryWrite(clientSocket, data, close);
	});

	serverSocket.on('end', () => {
		logger.debug(`[HTTPS END] server ended ${url.host}`);
		close();
	});

	serverSocket.on('error', error => {
		logger.error(`[HTTPS ERROR] server error ${error}`);
		close(error);
	});

	// -- clientSocket --

	clientSocket.once('data', clientHello => {
		const chunks = bufferToChunks(clientHello, proxy.config.clientHelloMTU);
		for (const chunk of chunks) {
			logger.debug(`[HTTPS HELLO] ${url.host} (length: ${chunk.length})`);
			tryWrite(serverSocket, chunk, close);
		}

		clientSocket.on('data', data => {
			logger.debug(`[HTTPS] send to ${url.host} (length: ${data.length})`);
			tryWrite(serverSocket, data, close);
		});
	});

	clientSocket.on('end', () => {
		logger.debug(`[HTTPS END] client ended ${url.host}`);
		close();
	});

	clientSocket.on('error', error => {
		logger.debug(`[HTTPS ERROR] client error ${error}`);
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
