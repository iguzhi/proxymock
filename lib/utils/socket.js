const net = require('net');

exports.createConnection = async function (opts) {
	// const t = new Date();
	return new Promise(resolve => {
		const socket = net.createConnection(opts, () => {
			// console.debug(`[Socket] connected to ${opts.host}:${opts.port}  (${new Date() - t} ms)`);
			resolve(socket);
		});
	});
}

exports.tryWrite = function (socket, data, onError) {
	try {
		socket.write(data);
	}
	catch (error) {
		onError && onError(error);
	}
}

exports.closeSocket = function (socket) {
	socket.removeAllListeners('data');
	socket.removeAllListeners('error');
	socket.end();
}
