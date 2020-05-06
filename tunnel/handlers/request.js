const { isStartOfHTTPRequest, isConnectMethod } = require('../http/utils');
const handleHTTP = require('./http');
const handleHTTPS = require('./https');

async function handleRequest(clientSocket, proxy) {
	clientSocket.resume();

	return new Promise((resolve, reject) => {
		clientSocket.once('data', async data => {
			try {
				clientSocket.pause();
				const strData = data.toString();

				if (isStartOfHTTPRequest(strData)) {
					if (isConnectMethod(strData)) {
						await handleHTTPS(clientSocket, data, proxy);
					} else {
						await handleHTTP(clientSocket, data, proxy);
					}
				} else {
					throw new Error('Unsupported request: ', strData);
				}

				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});
}

module.exports = handleRequest;
