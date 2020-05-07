const util = require('util');
const os = require('os');
const path = require('path');
const { exec, spawn } = require('child_process');
const Registry = require('winreg');

const pexec = util.promisify(exec);

class SystemProxy {
	async setProxy(ip, port) {
		throw new Error('You have to implement the method setProxy!');
	}
	async unsetProxy() {
		throw new Error('You have to implement the method unsetProxy!');
	}
}

// TODO: Add path http_proxy and https_proxy
// TODO: Support for non-gnome
class LinuxSystemProxy extends SystemProxy {
  constructor() {
    super()
  }

	async setProxy(ip, port) {
		await pexec('gsettings set org.gnome.system.proxy mode manual');
		await pexec(`gsettings set org.gnome.system.proxy.http host ${ip}`);
		await pexec(`gsettings set org.gnome.system.proxy.http port ${port}`);
	}

	async unsetProxy() {
		await pexec('gsettings set org.gnome.system.proxy mode none');
	}
}

// TODO: Support for lan connections too
// TODO: move scripts to ../scripts/darwin
class DarwinSystemProxy extends SystemProxy {
  constructor() {
    super()
  }

	async setProxy(ip, port) {
		const wifiAdaptor = (await pexec(`sh -c "networksetup -listnetworkserviceorder | grep \`route -n get 0.0.0.0 | grep 'interface' | cut -d ':' -f2\` -B 1 | head -n 1 | cut -d ' ' -f2"`)).stdout.trim();

		await pexec(`networksetup -setwebproxy '${wifiAdaptor}' ${ip} ${port}`);
		await pexec(`networksetup -setsecurewebproxy '${wifiAdaptor}' ${ip} ${port}`);
	}

	async unsetProxy() {
		const wifiAdaptor = (await pexec(`sh -c "networksetup -listnetworkserviceorder | grep \`route -n get 0.0.0.0 | grep 'interface' | cut -d ':' -f2\` -B 1 | head -n 1 | cut -d ' ' -f2"`)).stdout.trim();

		await pexec(`networksetup -setwebproxystate '${wifiAdaptor}' off`);
		await pexec(`networksetup -setsecurewebproxystate '${wifiAdaptor}' off`);
	}
}


class WindowsSystemProxy extends SystemProxy {
  constructor() {
    super()
  }

	async setProxy(ip, port) {
		const regKey = new Registry({
			hive: Registry.HKCU,
			key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'
		});

		await Promise.all([
			this._asyncRegSet(regKey, 'MigrateProxy', Registry.REG_DWORD, 1),
			this._asyncRegSet(regKey, 'ProxyEnable', Registry.REG_DWORD, 1),
			this._asyncRegSet(regKey, 'ProxyHttp1.1', Registry.REG_DWORD, 0),
			this._asyncRegSet(regKey, 'ProxyServer', Registry.REG_SZ, `${ip}:${port}`),
			this._asyncRegSet(regKey, 'ProxyOverride', Registry.REG_SZ, '*.local;<local>'),
		]);
		await this._resetWininetProxySettings();
	}

	async unsetProxy() {
		const regKey = new Registry({
			hive: Registry.HKCU,
			key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'
		});

		await Promise.all([
			this._asyncRegSet(regKey, 'ProxyEnable', Registry.REG_DWORD, 0),
			this._asyncRegSet(regKey, 'ProxyServer', Registry.REG_SZ, ``),
		]);
		await this._resetWininetProxySettings();
	}

	_asyncRegSet(regKey, name, type, value) {
		return new Promise((resolve, reject) => {
			regKey.set(name, type, value, e => {
				if (e) {
					reject(e);
				} else {
					resolve();
				}
			})
		});
	}

	_resetWininetProxySettings() {
		return new Promise((resolve, reject) => {
			const scriptPath = path.join(__dirname, 'wininet-reset-settings.ps1');
			const child = spawn("powershell.exe", [scriptPath]);
			child.stdout.setEncoding('utf8');
			child.stdout.on("data", (data) => {
				if (data.includes('True')) {
					resolve();
				} else {
					reject(data);
				}
			});

			child.stderr.on("data", (err) => {
				reject(err);
			});

			child.stdin.end();
		});
	}
}

function getSystemProxy() {
	switch (os.platform()) {
		case 'darwin':
			return DarwinSystemProxy;
		case 'linux':
			return LinuxSystemProxy;
		case 'win32':
		case 'win64':
			return WindowsSystemProxy;
		case 'unknown os':
		default:
			throw new Error(`UNKNOWN OS TYPE ${os.platform()}`);
	}
}

exports.setProxy = async function(ip, port) {
	try {
    const SystemProxy = getSystemProxy();
		const systemProxy = new SystemProxy();
		await systemProxy.setProxy(ip, port);
	} catch (error) {
		console.error(`[SYSTEM PROXY] error on SetProxy (${error})`)
	}
}

exports.unsetProxy = async function() {
	try {
		const SystemProxy = getSystemProxy();
		const systemProxy = new SystemProxy();
		await systemProxy.unsetProxy();
	} catch (error) {
		console.error(`[SYSTEM PROXY] error on UnsetProxy (${error})`)
	}
}