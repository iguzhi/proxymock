exports.bufferToChunks = function (buffer, chunkSize) {
	const result = [];
	const len = buffer.length;
	let i = 0;

	while (i < len) {
		result.push(buffer.slice(i, i += chunkSize));
	}

	return result;
}

exports.decode = function (buf) {
	return buf.toString();
}