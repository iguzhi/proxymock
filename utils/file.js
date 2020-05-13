'use strict'

const fs = require('fs');
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

exports.getUserHome = () => {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}
