const  { URL } = require('url');
const { isStartOfHTTPRequest } = require('../http/utils');
const { createConnection, closeSocket, tryWrite } = require('../utils/socket');
const HTTPRequest = require('../http/request');
const { decode } = require('../utils/buffer');
const { getLogger } = require('../../../utils/logger');
const logger = getLogger('http');

async function handleHTTP(clientSocket, firstChunk, proxy) {
	logger.debug(`[HTTP firstChunk] ${firstChunk}`);
	const firstLine = firstChunk.toString().split('\r\n')[0];
	logger.debug(`[HTTP firstLine] ${firstLine}`);
	const requestUrl = firstLine.split(/\s+/)[1];
	logger.debug(`[HTTP requestUrl] ${requestUrl}`);
	const url = new URL(requestUrl);

	const host = url.hostname;
	const port = url.port || 80;

	logger.debug(`[HTTP REQUEST] ${url.host}`);

	// -- ServerSocket --

	const serverSocket = await createConnection({host, port}, proxy.dns);

	const close = () => {
		closeSocket(clientSocket);
		closeSocket(serverSocket);
	};

	tryWrite(serverSocket, interceptRequest(firstChunk), close);

	serverSocket.on('data', data => {
		logger.debug(`[HTTP] receive from ${url.host} (length: ${data.length})`);
		logger.info('[HTTP] receive data: ', decode(data));
		tryWrite(clientSocket, data, close);
	});

	serverSocket.on('error', error => {
		logger.error(`[HTTP ERROR] server error ${error}`);
		close(error);
	});

	serverSocket.on('end', () => {
		logger.debug(`[HTTP END] server ended ${url.host}`);
		close();
	});

	// -- clientSocket --

	clientSocket.on('data', data => {
		logger.debug(`[HTTP] send to ${url.host} (length: ${data.length})`);
		tryWrite(serverSocket, interceptRequest(data), close);
	});

	clientSocket.on('end', () => {
		close();
	});

	clientSocket.resume();
}

function interceptRequest(data) {
	const strData = data.toString();
	logger.debug(`[HTTP] interceptRequest ${strData}`);
	if (isStartOfHTTPRequest(strData)) {
		const request = new HTTPRequest(strData);
		logger.debug(`[HTTP] request`, request);
		request.path = new URL(request.path).pathname;
		delete request.headers['Proxy-Connection'];
		return request.toString();
	}

	return data;
}

module.exports = handleHTTP;
