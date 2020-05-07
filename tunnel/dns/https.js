
const  { promisify } = require('util');
const doh = require('dns-over-http');
const BaseDNS = require('./base');

const dohQueryAsync = promisify(doh.query);

class DNSOverHTTPS extends BaseDNS {
	constructor(dnsServer) {
		super();
		this.dnsServer = dnsServer;
	}

	async _lookup(hostname) {
		const result = await dohQueryAsync({url: this.dnsServer}, [{type: 'A', name: hostname}]);
		const answers = result.answers;
		const firstAnswer = answers && answers[0];
		return firstAnswer && firstAnswer.data;
	}
}

module.exports = DNSOverHTTPS;
