const { parseRequest } = require('./utils');

class HTTPResponse {
	constructor(rawRsp) {
		if (rawRsp) {
			const packet = this._parseResponse(rawRsp);
			this.httpVersion = packet.httpVersion;
			this.statusCode = packet.statusCode;
			this.statusMessgae = packet.statusMessgae;
			this.headers = packet.headers;
			this.payload = packet.payload;
		} else {
			this.httpVersion = 'HTTP/1.1';
			this.statusCode = 200;
			this.statusMessgae = 'OK';
			this.headers = {};
			this.payload = '';
		}
	}

	_parseResponse(rawRsp) {
		const {firstLineParts, ...response} = parseRequest(rawRsp);

		response.httpVersion = firstLineParts[0];
		response.statusCode = firstLineParts[1];
		response.statusMessgae = firstLineParts[2];
		console.log(response)
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

module.exports = HTTPResponse;
