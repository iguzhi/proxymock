'use strict'

const os = require('os');
const child_process = require('child_process');
const util = require('util');
const networkTypes = ['Ethernet', 'Thunderbolt Ethernet', 'Wi-Fi'];
const exec = util.promisify(child_process.exec);

function execSync(cmd) {
  let stdout,
    status = 0;
  try {
    stdout = child_process.execSync(cmd);
  } catch (err) {
    stdout = err.stdout;
    status = err.status;
  }

  return {
    stdout: stdout.toString(),
    status
  };
}

/**
 * proxy for CentOs
 * ------------------------------------------------------------------------
 *
 * file: ~/.bash_profile
 *
 * http_proxy=http://proxy_server_address:port
 * export no_proxy=localhost,127.0.0.1,192.168.0.34
 * export http_proxy
 * ------------------------------------------------------------------------
 */

/**
 * proxy for Ubuntu
 * ------------------------------------------------------------------------
 *
 * file: /etc/environment
 * more info: http://askubuntu.com/questions/150210/how-do-i-set-systemwide-proxy-servers-in-xubuntu-lubuntu-or-ubuntu-studio
 *
 * http_proxy=http://proxy_server_address:port
 * export no_proxy=localhost,127.0.0.1,192.168.0.34
 * export http_proxy
 * ------------------------------------------------------------------------
 */

/**
 * ------------------------------------------------------------------------
 * mac proxy manager
 * ------------------------------------------------------------------------
 */

const linuxProxyManager = {};

linuxProxyManager.getProxyState = () => ''

linuxProxyManager.getNetworkType = () => ''

linuxProxyManager.setProxy = async (ip, port) => {
  await exec('gsettings set org.gnome.system.proxy mode manual');
  await exec(`gsettings set org.gnome.system.proxy.http host ${ip}`);
  await exec(`gsettings set org.gnome.system.proxy.http port ${port}`);
}

linuxProxyManager.unsetProxy = async () => {
  await exec('gsettings set org.gnome.system.proxy mode none');
}


const macProxyManager = {};

macProxyManager.getNetworkType = () => {
  for (let i = 0; i < networkTypes.length; i++) {
    const type = networkTypes[i],
      result = execSync('networksetup -getwebproxy ' + type);

    if (result.status === 0) {
      macProxyManager.networkType = type;
      return type;
    }
  }

  throw new Error('Unknown network type');
}

// macProxyManager.setProxy = async (ip, port) => {
//   const wifiAdaptor = (await exec(`sh -c "networksetup -listnetworkserviceorder | grep \`route -n get 0.0.0.0 | grep 'interface' | cut -d ':' -f2\` -B 1 | head -n 1 | cut -d ' ' -f2"`)).stdout.trim();

//   await exec(`networksetup -setwebproxy '${wifiAdaptor}' ${ip} ${port}`);
//   await exec(`networksetup -setsecurewebproxy '${wifiAdaptor}' ${ip} ${port}`);
// }

// macProxyManager.unsetProxy = () => {
//   const wifiAdaptor = (await exec(`sh -c "networksetup -listnetworkserviceorder | grep \`route -n get 0.0.0.0 | grep 'interface' | cut -d ':' -f2\` -B 1 | head -n 1 | cut -d ' ' -f2"`)).stdout.trim();

//   await exec(`networksetup -setwebproxystate '${wifiAdaptor}' off`);
//   await exec(`networksetup -setsecurewebproxystate '${wifiAdaptor}' off`);
// }

macProxyManager.setProxy = (ip, port, proxyType) => {
  if (!ip || !port) {
    console.log('failed to set global proxy server.\n ip and port are required.');
    return;
  }

  if (!proxyType) {
    macProxyManager.setProxy(ip, port, 'http');
    macProxyManager.setProxy(ip, port, 'https');
    return;
  }

  // proxyType = proxyType || 'http';

  const networkType = macProxyManager.networkType || macProxyManager.getNetworkType();

  return /^http$/i.test(proxyType) ?

    // set http proxy
    execSync(
      'networksetup -setwebproxy ${networkType} ${ip} ${port} && networksetup -setproxybypassdomains ${networkType} 127.0.0.1 localhost'
        .replace(/\${networkType}/g, networkType)
        .replace('${ip}', ip)
        .replace('${port}', port)) :

    // set https proxy
    execSync('networksetup -setsecurewebproxy ${networkType} ${ip} ${port} && networksetup -setproxybypassdomains ${networkType} 127.0.0.1 localhost'
      .replace(/\${networkType}/g, networkType)
      .replace('${ip}', ip)
      .replace('${port}', port));
}

macProxyManager.unsetProxy = (proxyType) => {
  if (!proxyType) {
    macProxyManager.unsetProxy('http');
    macProxyManager.unsetProxy('https');
    return;
  }
  // proxyType = proxyType || 'http';
  const networkType = macProxyManager.networkType || macProxyManager.getNetworkType();
  return /^http$/i.test(proxyType) ?

    // set http proxy
    execSync(
      'networksetup -setwebproxystate ${networkType} off'
        .replace('${networkType}', networkType)) :

    // set https proxy
    execSync(
      'networksetup -setsecurewebproxystate ${networkType} off'
        .replace('${networkType}', networkType));
}

macProxyManager.getProxyState = () => {
  const networkType = macProxyManager.networkType || macProxyManager.getNetworkType();
  const result = execSync('networksetup -getwebproxy ${networkType}'.replace('${networkType}', networkType));

  return result;
}


/**
 * ------------------------------------------------------------------------
 * windows proxy manager
 *
 * netsh does not alter the settings for IE
 * ------------------------------------------------------------------------
 */

const winProxyManager = {};

winProxyManager.setProxy = (ip, port) => {
  if (!ip && !port) {
    console.log('failed to set global proxy server.\n ip and port are required.');
    return;
  }

  const result = execSync(
    // set proxy
    'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d ${ip}:${port} /f & '
      .replace('${ip}', ip)
      .replace('${port}', port) +

    // enable proxy
    'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f'
  );
  return result;
}

winProxyManager.unsetProxy = () => {
  const result = execSync(
    'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f'
  );
  return result;
}

winProxyManager.getProxyState = () => ''

winProxyManager.getNetworkType = () => ''

function getSystemProxy() {
	switch (os.platform()) {
		case 'darwin':
			return macProxyManager;
		case 'linux':
			return linuxProxyManager;
		case 'win32':
		case 'win64':
			return winProxyManager;
		case 'unknown os':
		default:
			throw new Error(`UNKNOWN OS TYPE ${os.platform()}`);
	}
}

module.exports = getSystemProxy();