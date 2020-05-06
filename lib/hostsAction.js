'use strict'

const fs = require('fs');
const path = require('path');
const { makeId } = require('../utils');
const { workPath, sysHostsPath } = require('./paths');
// const clearDNSCache = require('../libs/chrome-dns-clear');

// 备份系统hosts配置
exports.backupSysHostsConf = () => {
  const is_dir = fs.existsSync(workPath) && fs.lstatSync(workPath).isDirectory();
  if (!is_dir) {
    fs.mkdirSync(workPath);
  }

  const cnt = fs.readFileSync(sysHostsPath, 'utf-8');
  const backupFilePath = path.join(workPath, 'sysHosts.backup.json');
  const data = {
    list: [{
      title: 'backup',
      id: makeId(),
      content: cnt
    }]
  }
  console.log('system hosts conf backup to ', backupFilePath);
  fs.writeFileSync(backupFilePath, JSON.stringify(data), 'utf-8');
}

// 恢复系统hosts配置
exports.restoreSysHostsConf = () => {
  const isDir = fs.existsSync(workPath) && fs.lstatSync(workPath).isDirectory();
  if (!isDir) {
    fs.mkdirSync(workPath);
  }

  const backupFilePath = path.join(workPath, 'sysHosts.backup.json');
  const isFile = fs.existsSync(backupFilePath) && fs.lstatSync(backupFilePath).isFile();
  if (!isFile) {
    console.error(`[Error restoreSysHostsConf]: ${backupFilePath} is not a file.`);
    return;
  }

  const cnt = fs.readFileSync(backupFilePath, 'utf-8');
  const data = JSON.parse(cnt);
  const conf = data && Array.isArray(data.list) && data.list.map(item => item.content).join('\n') || '';
  console.log('restore system hosts conf from %s to %s', backupFilePath, sysHostsPath);
  fs.writeFileSync(sysHostsPath, conf, 'utf-8');
}

// 使用自定义hosts配置
exports.useHostsConf = (hostsConfPath) => {
  const isFile = fs.existsSync(hostsConfPath) && fs.lstatSync(hostsConfPath).isFile();
  if (!isFile) {
    console.error(`[Error useHostsConf]: ${hostsConfPath} is not a file.`);
    return;
  }

  const cnt = fs.readFileSync(hostsConfPath, 'utf-8');
  console.log('use hosts conf from %s', hostsConfPath);
  fs.writeFileSync(sysHostsPath, cnt, 'utf-8');
}
