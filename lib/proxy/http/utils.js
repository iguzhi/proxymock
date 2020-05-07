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



exports.parseHeaders = function (headerLines) {
	const headers = {};

	for (const line of headerLines) {
		const [name, value] = line.split(/ *: */);
		headers[name] = value;
	}

	return headers;
}

exports.parseRequest = function (rawRequest) {
	const mainParts = rawRequest.split('\r\n\r\n');
	const headersPart = mainParts[0];
	const payload = mainParts[1];

	const headerLines = headersPart.split('\r\n');
	const firsLine = headerLines.shift();

	const firstLineParts = firsLine.split(/\s+/);
	const headers = exports.parseHeaders(headerLines);

	return {
		firstLineParts,
		headers,
		payload
	};
}

exports.isConnectMethod = function (rawInput) {
	const firstWord = rawInput.split(/\s+/)[0];
	return firstWord.toUpperCase() === 'CONNECT';
}

exports.isStartOfHTTPRequest = function (rawRequest) {
	// Valid methods (for http request)
	const firstWord = rawRequest.split(/\s+/)[0];
	if (validMethods.includes(firstWord.toUpperCase())) {
		return true;
	}

	// Like HTTP/1.1 (For http response)
	const httpWord = firstWord.split('/')[0];
	if (httpWord.toLowerCase() === 'http') {
		return true;
	}

	return false;
}

