'use strict'
const isWin32 = process.platform === 'win32';
const br = isWin32 ? '\r\n' : '\n';

exports.makeId = () => {
  return (new Date()).getTime() + '-' + Math.floor(Math.random() * 1e6);
}

exports.replaceBr = (content) => {
  return content.replace(/\r/g, '').split('\n').join(br);
}