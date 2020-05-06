'use strict'

const path = require('path');
const file = require('../utils/file');
const platform = process.platform;

// Windows 系统有可能不安装在 C 盘
const sysHostsPath = platform === 'win32' ? `${process.env.windir || 'C:\\WINDOWS'}\\system32\\drivers\\etc\\hosts` : '/etc/hosts';

const homePath = file.getUserHome();
const workPath = path.join(homePath, '.ProxyMock');
const dataPath = path.join(workPath, 'data.json');
const preferencePath = path.join(workPath, 'preferences.json');

if (!file.isDirectory(workPath) || !file.isFile(path.join(workPath, 'data.json'))) {
  try {
    require('./hostsAction')(workPath, sysHostsPath);
  }
  catch (e) {
    console.error(e);
  }
}

module.exports = {
  homePath,
  workPath,
  dataPath,
  preferencePath,
  sysHostsPath
};
