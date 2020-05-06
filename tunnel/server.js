const Proxy = require('./proxy');

async function main() {
  const proxy = new Proxy({
    ip: '127.0.0.1',
    port: '8000',
    dns: {
      type: 'https',
      server: 'https://cloudflare-dns.com/dns-query'
    },
    source: 'CLI',
  });
  
  const exitTrap = async () => {
    console.debug('Caught interrupt signal');
    await proxy.stop();
    console.debug('Successfully Closed!');
  
    // if (!argv['silent']) {
    //   clear();
    // }
  
    process.exit(0);
  };
  
  const errorTrap = error => {
    console.error(error);
  };
  
  process.on('SIGINT', exitTrap);
  process.on('unhandledRejection', errorTrap);
  process.on('uncaughtException', errorTrap);
  
  await proxy.start({setProxy: 'system-proxy'});
}

main();