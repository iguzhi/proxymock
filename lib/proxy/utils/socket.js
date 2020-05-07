const net = require('net');
const { getLogger } = require('../../../utils/logger');
const logger = getLogger('socket');

exports.createConnection = async function (opts, dns) {
	const ip = await dns.lookup(opts.host);

	const t = new Date();
	return new Promise(resolve => {
		const socket = net.createConnection({...opts, host: ip}, () => {
			logger.debug(`[Socket] connected to ${opts.host} (${ip}) (${new Date() - t} ms)`);
			// socket.setEncoding('utf8'); // 返回utf8字符串
			resolve(socket);
		});
	});
}

exports.tryWrite = function (socket, data, onError) {
	try {
		socket.write(data);
	} catch (error) {
		if (onError) {
			onError(error);
		}
	}
}

exports.closeSocket = function (socket) {
	socket.removeAllListeners('data');
	socket.removeAllListeners('error');
	socket.end();
}
