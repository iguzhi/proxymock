const chalk = require('chalk');
const { fixServerAddress } = require('../utils/fix');
const { createHttpsServer } = require('../servers/webServers');
const { createConnection, closeSocket, tryWrite } = require('../utils/socket');
const { getConnectionEstablishedPacket, parseHostname } = require('../utils/http');
const { getLogger } = require('../utils/logger');
const logger = getLogger('https');

const httpsServersCache = Object.create(null);

async function handleHTTPS(clientSocket, app, firstChunk) {
  const hostname = parseHostname(firstChunk);
  let httpsServer = httpsServersCache[hostname];
  if (!httpsServer) {
    httpsServer = await createHttpsServer(app, hostname);
    httpsServersCache[hostname] = httpsServer; // 同一个hostname缓存httpsServer
    let addr = httpsServer.address();
    addr = fixServerAddress(addr);

    // console.info('%s HTTPS Server is listening on %s://%s:%s for domain %s', chalk.green('[proxymock]'), chalk.yellow('https'), chalk.yellow(addr.ip), chalk.yellow(addr.port), hostname);
    logger.info('[proxymock] HTTPS SNI Server is listening on https://%s:%s for domain %s', addr.ip, addr.port, hostname);
  }

  let addr = httpsServer.address();
  addr = fixServerAddress(addr);

	// -- ServerSocket --
  // 转发到https服务器
	const serverSocket = await createConnection({ host: addr.ip, port: addr.port });

	const close = (error) => {
		closeSocket(clientSocket);
    closeSocket(serverSocket);
    error && logger.error(error);
	};

	// serverSocket.on('data', data => {
	// 	tryWrite(clientSocket, data, close);
	// });

	serverSocket.on('end', () => {
		close();
	});

	serverSocket.on('error', error => {
		close(error);
	});

	// -- clientSocket --

	// clientSocket.once('data', clientHello => {
	// 	const chunks = bufferToChunks(clientHello, chunkSize || 100);
	// 	for (const chunk of chunks) {
	// 		tryWrite(serverSocket, chunk, close);
	// 	}

	// 	clientSocket.on('data', data => {
	// 		tryWrite(serverSocket, data, close);
	// 	});
	// });

	clientSocket.on('end', () => {
		close();
	});

	clientSocket.on('error', error => {
		close(error);
	});

  tryWrite(clientSocket, getConnectionEstablishedPacket(), close);
  clientSocket.pipe(serverSocket).pipe(clientSocket);
	clientSocket.resume();
}

process.on('SIGINT', async () => {
  for (let hostname in httpsServersCache) {
    httpsServersCache[hostname].close();
  }
});


module.exports = handleHTTPS;
