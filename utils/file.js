'use strict'

const fs = require('fs');
const crypto = require('crypto');
const md5File = require('md5-file');
const path = require('path');

/**
 * 确保路径对应的目录存在, 若不存在则新建目录, 若存在则不做任何操作(支持多级目录)
 * @param {String} dirpath 目录路径
 */
exports.ensureDirExists = (dirpath) => {
  let sep = /\//.test(dirpath) ? '/' : (/\\/.test(dirpath) ? '\\' : '');
  let pathArr = dirpath.split(sep);
  dirpath = '';
  pathArr.forEach((s, index) => {
    if (index === 0) {
      if (s === '') {
        dirpath += sep;
      }
      else if (s === '.') {
        dirpath += '.' + sep;
      }
      else {
        dirpath += s + sep;
      }
    }
    else {
      dirpath += s + sep;
    }

    if (fs.existsSync(dirpath)) {
      let stat = fs.lstatSync(dirpath);
      if (!stat.isDirectory()) {
        fs.mkdirSync(dirpath);
      }
    }
    else {
      fs.mkdirSync(dirpath);
    };
  })
}

exports.getLogsDir = () => {
  let dir = path.dirname(__filename), prev;
  while (true) {
    if (dir === '.') {
      // Avoids an infinite loop in rare cases, like the REPL
      dir = process.cwd();
    }
    let arr = dir.split(path.sep);
    if (arr && arr[arr.length - 1] === 'node_modules') {
      dir = path.join(dir, '..');
      return dir;
    }
    if (prev === dir) {
      // Got to the top
      dir = '.'
      return dir;
    }
    // Try the parent dir next
    prev = dir
    dir = path.join(dir, '..');
  }
}

exports.getUserHome = () => {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

exports.isFile = (p) => {
  try {
    if (fs.statSync(p).isFile()) {
      return true;
    }
  }
  catch (e) {
  }
  return false;
}

exports.isDirectory = (p) => {
  try {
    if (fs.statSync(p).isDirectory()) {
      return true;
    }
  }
  catch (e) {
  }
  return false;
}

exports.writeFile = (filepath, data, callback) => {
  let cntMd5 = crypto.createHash('md5').update(data).digest('hex');
  if (isFile(filepath) && md5File.sync(filepath) === cntMd5) {
    callback();
  }
  else {
    console.log(`md5 not match, save new content to: [${filepath}].`);
    fs.writeFile(filepath, data, 'utf-8', callback);
  }
}

exports.pWriteFile = (filepath, data) => {
  return new Promise((resolve, reject) => {
    writeFile(filepath, data, (e, v) => e ? reject(e) : resolve(v));
  });
}

exports.readFile = (filepath, callback) => {
  if (!isFile(filepath)) {
    callback(null, '');
  }
  else {
    fs.readFile(filepath, 'utf-8', callback);
  }
}

exports.pReadFile = (filepath) => {
  return new Promise((resolve, reject) => {
    readFile(filepath, (e, v) => e ? reject(e) : resolve(v));
  });
}