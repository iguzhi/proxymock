const { isHTTPRequest, isConnectMethod } = require('../utils/http');
const handleHttp = require('./http');
const handleHttps = require('./https');

/**
 * 
 * @param {Socket} clientSocket 
 * @param {Object} { httpsServerAddress: { host, ip, port }, httpServerAddress: { host, ip, port } }
 */
async function handleRequest(clientSocket, { httpsServerAddress, httpServerAddress }) {
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
        isSecureHTTP ? await handleHttps(clientSocket, httpsServerAddress) : await handleHttp(clientSocket, httpServerAddress, buf);

				resolve(isSecureHTTP);
      }
      catch (error) {
				reject(error);
			}
		});
	});
}

module.exports = handleRequest;
