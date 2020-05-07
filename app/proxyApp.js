const portfinder = require('portfinder');
const Proxy = require('../lib/proxy');

module.exports = ({ router }) => {
  let px;

  portfinder.getPortPromise({
    port: 8000,    // minimum port
    stopPort: 9999 // maximum port
  })
  .then((port) => {
    //
    // `port` is guaranteed to be a free port
    // in this scope.
    //
    px = new Proxy({
      port,
      dns: {
        type: 'https', // 'tls' or 'https'
        server: 'https://cloudflare-dns.com/dns-query',
        cacheSize: 1000,
      }
    });
    px.start({setProxy: true})
  })
  .catch((err) => {
    //
    // Could not get a free port, `err` contains the reason.
    //
    console.error('[Error PortFinder]', err);
  });

  process.on('SIGINT', function () {
    px && px.stop();
    process.exit();
  });

  process.on('uncaughtException', function (e) {
    console.error('uncaughtException: ', e);
  });

  process.on('unhandledRejection', function (e) {
    console.error('unhandledRejection: ', e);
  });
}


