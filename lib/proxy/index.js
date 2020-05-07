const net = require('net');
const { setProxy, unsetProxy } = require('./utils/systemProxy');
const handleRequest = require('./handlers/request');
const DNSOverTLS = require('./dns/tls');
const DNSOverHTTPS = require('./dns/https');
const config = require('./config');
const { getLogger } = require('../../utils/logger');
const logger = getLogger('proxy');

class Proxy {
	constructor(customConfig) {
		this.config = {...config, ...customConfig};
		this.server = undefined;
		this.isSystemProxySet = false;
		this.initDNS();
	}

	initDNS() {
		this.dns = this.config.dns.type === 'https' ?
			new DNSOverHTTPS(this.config.dns.server) :
			new DNSOverTLS(this.config.dns.server);
	}

	async start(options = {}) {
		options.setProxy = options.setProxy === undefined ? false : options.setProxy;

		this.server = net.createServer({pauseOnConnect: true}, clientSocket => {
      logger.debug('client connected');
      // clientSocket.setEncoding('utf8'); // utf8字符
			handleRequest(clientSocket, this).catch(err => {
				logger.error(String(err));
			});
			clientSocket.on('end', () => {
				logger.debug('client disconnected');
      });
      
      // clientSocket.pipe(clientSocket);
		});

		this.server.on('error', err => {
			logger.error(err.toString());
		});

		this.server.on('close', () => {
			logger.error('server closed');
		});

		await new Promise(resolve => {
			this.server.listen(this.config.port, this.config.ip, () => resolve());
		});

		const { address, port } = this.server.address();
		logger.debug(`server listen on ${address} port ${port}`);
		console.debug(`server listen on ${address} port ${port}`);

		if (options.setProxy) {
			setProxy(address, port);
			this.isSystemProxySet = true;
			logger.debug('system proxy set');
		}
	}

	async stop() {
		if (this.server) {
			this.server.close();
		}
		
		if (this.isSystemProxySet) {
			unsetProxy();
			this.isSystemProxySet = false;
			logger.debug('system proxy unset');
		}
	}
}

module.exports = Proxy;
