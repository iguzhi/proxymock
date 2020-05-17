'use strict'

const chalk = require('chalk');
const util = require('./util');

let logLevel = 1;

const properties = {
  writable: false,
  configurable: false,
  enumerable: true
};

const logLevelMap = Object.create(null);
Object.defineProperties(logLevelMap, {
  debug: {
    value: 0,
    ...properties
  },
  info: {
    value: 1,
    ...properties
  },
  warn: {
    value: 2,
    ...properties
  },
  error: {
    value: 3,
    ...properties
  }
});

function setLevel(level) {
  logLevel = parseInt(level, 10);
}

function printLog(content, type) {
  if (logLevel < type) {
    return;
  }
  const timeString = util.formatDate(new Date(), 'YYYY-MM-DD hh:mm:ss');
  switch (type) {
    case logLevelMap.debug: console.debug(chalk.cyan('[proxymock debug]', timeString, content)); break;
    case logLevelMap.info: console.info(chalk.green('[proxymock info]', timeString, content)); break;
    case logLevelMap.warn: console.warn(chalk.yellow('[proxymock warn]', timeString, content)); break;
    case logLevelMap.error: console.error(chalk.red('[proxymock error]', timeString, content)); break;
    default : console.green(chalk.cyan('[proxymock info]', timeString, content));
  }
}

exports.printLog = printLog;

exports.debug = (content) => {
  printLog(content, logLevelMap.debug);
};

exports.info = (content) => {
  printLog(content, logLevelMap.info);
};

exports.warn = (content) => {
  printLog(content, logLevelMap.warn);
};

exports.error = (content) => {
  printLog(content, logLevelMap.error);
};

exports.setLogLevel = setLevel;
exports.logLevelMap = logLevelMap;
