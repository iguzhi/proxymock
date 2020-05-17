const url = require('url');
const { HTTPResponse, HTTPRequest, parseRequest } = require('./httpParser');

const validMethods = [
	'DELETE',
	'GET',
	'HEAD',
	'POST',
	'PUT',
	'CONNECT',
	'OPTIONS',
	'TRACE',
	'COPY',
	'LOCK',
	'MKCOL',
	'MOVE',
	'PROPFIND',
	'PROPPATCH',
	'SEARCH',
	'UNLOCK',
	'BIND',
	'REBIND',
	'UNBIND',
	'ACL',
	'REPORT',
	'MKACTIVITY',
	'CHECKOUT',
	'MERGE',
	'M-SEARCH',
	'NOTIFY',
	'SUBSCRIBE',
	'UNSUBSCRIBE',
	'PATCH',
	'PURGE',
	'MKCALENDAR',
	'LINK',
	'UNLINK'
];

exports.isConnectMethod = function (rawInput) {
	const firstWord = rawInput.split(/\s+/)[0];
	return firstWord.toUpperCase() === 'CONNECT';
}

exports.isHTTPRequest = function (rawRequest) {
	// Valid methods (for http request)
	const firstWord = rawRequest.split(/\s+/)[0];
	if (validMethods.includes(firstWord.toUpperCase())) {
		return true;
	}

	// Like HTTP/1.1 (For http response)
	const firstLine = rawRequest.split(/[\r\n]/)[0];
	if (firstLine.toUpperCase().indexOf('HTTP/') !== -1) {
		return true;
	}

	return false;
}

exports.getConnectionEstablishedPacket = () => {
	const packet = new HTTPResponse();
	packet.statusCode = 200;
	packet.statusMessgae = 'Connection Established';
	return packet.toString();
}

exports.interceptRequest = buf => {
	const strData = buf.toString();

	if (exports.isHTTPRequest(strData)) {
		const request = new HTTPRequest(strData);
		// request.path = new URL(request.path).pathname; // 会丢失query
		delete request.headers['Proxy-Connection'];
		return request.toString();
	}

	return buf;
}

exports.parseHostname = firstTrunk => {
  const { firstLineParts } = parseRequest(firstTrunk);
  const path = firstLineParts[1];
  return url.parse('https://' + path).hostname;
  // return path;
}
