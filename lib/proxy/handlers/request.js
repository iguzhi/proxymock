const { isStartOfHTTPRequest, isConnectMethod } = require('../http/utils');
const handleHTTP = require('./http');
const handleHTTPS = require('./https');
const { getLogger } = require('../../../utils/logger');
const logger = getLogger('request');

async function handleRequest(clientSocket, proxy) {
	clientSocket.resume();

	return new Promise((resolve, reject) => {
		clientSocket.once('data', async data => {
			try {
				clientSocket.pause();
				const strData = data.toString();
				logger.debug(`[REQUEST] strData ${strData}`);
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
