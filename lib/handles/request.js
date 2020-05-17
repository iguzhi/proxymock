const { isHTTPRequest, isConnectMethod } = require('../utils/http');
const handleHttp = require('./http');
const handleHttps = require('./https');

/**
 *
 * @param {Socket} clientSocket
 * @param {Express} app
 */
async function handleRequest(clientSocket, app) {
	clientSocket.resume();

	return new Promise((resolve, reject) => {
		clientSocket.once('data', async buf => {
			try {
				clientSocket.pause();
        const strData = buf.toString();
        const isHTTP = isHTTPRequest(strData);

        if (!isHTTP) {
          throw new Error('Unsupported request: ', strData);
        }

        const isSecureHTTP = isConnectMethod(strData);
        isSecureHTTP ? await handleHttps(clientSocket, app, strData) : await handleHttp(clientSocket, app, buf);

				resolve(isSecureHTTP);
      }
      catch (error) {
				reject(error);
			}
		});
	});
}

module.exports = handleRequest;
