'use strict'

const fs = require('fs');
const crypto = require('crypto');
const md5File = require('md5-file');

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