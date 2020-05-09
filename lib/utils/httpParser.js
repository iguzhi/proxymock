function parseHeaders(headerLines) {
	const headers = {};

	for (const line of headerLines) {
		const [name, value] = line.split(/ *: */);
		headers[name] = value;
	}

	return headers;
}

function parseRequest(rawRequest) {
	const mainParts = rawRequest.split('\r\n\r\n');
	const headersPart = mainParts[0];
	const payload = mainParts[1];

	const headerLines = headersPart.split('\r\n');
	const firsLine = headerLines.shift();

	const firstLineParts = firsLine.split(/\s+/);
	const headers = parseHeaders(headerLines);

	return {
		firstLineParts,
		headers,
		payload
	};
}

class HTTPRequest {
	constructor(rawReq) {
		if (rawReq) {
			const packet = this._parseRequest(rawReq);
			this.method = packet.method;
			this.path = packet.path;
			this.httpVersion = packet.httpVersion;
			this.headers = packet.headers;
			this.payload = packet.payload;
		} else {
			this.method = 'GET';
			this.path = '/';
			this.httpVersion = 'HTTP/1.1';
			this.headers = {};
			this.payload = '';
		}
	}

	_parseRequest(rawReq) {
		const { firstLineParts, ...request } = parseRequest(rawReq);

		request.method = firstLineParts[0];
		request.path = firstLineParts[1];
		request.httpVersion = firstLineParts[2];
		return request;
	}

	toString() {
		let result = '';

		result += `${this.method} ${this.path} ${this.httpVersion}\r\n`;

		for (const header in this.headers) {
			result += `${header}: ${this.headers[header]}\r\n`;
		}

		result += '\r\n';
		result += this.payload;

		return result;
	}
}

class HTTPResponse {
	constructor(rawRsp) {
		if (rawRsp) {
			const packet = this._parseResponse(rawRsp);
			this.httpVersion = packet.httpVersion;
			this.statusCode = packet.statusCode;
			this.statusMessgae = packet.statusMessgae;
			this.headers = packet.headers;
			this.payload = packet.payload;
		}
		else {
			this.httpVersion = 'HTTP/1.1';
			this.statusCode = 200;
			this.statusMessgae = 'OK';
			this.headers = {};
			this.payload = '';
		}
	}

	_parseResponse(rawRsp) {
		const { firstLineParts, ...response } = parseRequest(rawRsp);

		response.httpVersion = firstLineParts[0];
		response.statusCode = firstLineParts[1];
		response.statusMessgae = firstLineParts[2];
		return response;
	}

	toString() {
		let result = '';

		result += `${this.httpVersion} ${this.statusCode} ${this.statusMessgae}\r\n`;

		for (const header in this.headers) {
			result += `${header}: ${this.headers[header]}\r\n`;
		}

		result += '\r\n';
		result += this.payload;
		
		return result;
	}
}

module.exports = {
  HTTPRequest,
  HTTPResponse
};
