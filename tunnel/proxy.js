const net = require('net');
const { setProxy, unsetProxy } = require('./utils/systemProxy');
const handleRequest = require('./handlers/request');
const DNSOverTLS = require('./dns/tls');
const DNSOverHTTPS = require('./dns/https');
const { appInit } = require('./utils/analytics');
const config = require('./config');

class Proxy {
	constructor(customConfig) {
		this.config = {...config, ...customConfig};
		this.server = undefined;
		this.isSystemProxySet = false;
		this.initDNS();
		appInit(customConfig.source);
	}

	initDNS() {
		this.dns = this.config.dns.type === 'https' ?
			new DNSOverHTTPS(this.config.dns.server) :
			new DNSOverTLS(this.config.dns.server);
	}

	async start(options = {}) {
		options.setProxy = options.setProxy === undefined ? false : options.setProxy;

		this.server = net.createServer({pauseOnConnect: true}, clientSocket => {
			handleRequest(clientSocket, this).catch(err => {
				console.error(String(err));
			});
		});

		this.server.on('error', err => {
			console.error(err.toString());
		});

		this.server.on('close', () => {
			console.error('server closed');
		});

		await new Promise(resolve => {
			this.server.listen(this.config.port, this.config.ip, () => resolve());
		});

		const {address, port} = this.server.address();
		console.debug(`server listen on ${address} port ${port}`);

		if (options.setProxy) {
			await setProxy(address, port);
			this.isSystemProxySet = true;
			console.debug('system proxy set');
		}
	}

	async stop() {
		if (this.server) {
			this.server.close();
		}

		if (this.isSystemProxySet) {
			await unsetProxy();
			this.isSystemProxySet = false;
			console.debug('system proxy unset');
		}
	}
}

module.exports = Proxy;
