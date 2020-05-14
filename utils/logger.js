'use strict';

const _ = require('lodash');
const { ensureDirExists, getLogsDir, getUserHome } = require('./file');
const log4js = require('log4js'); // maxLogSize是以byte为单位计算的
const { loggerConf } = require('../config');

const logger = {};

function initLogger(logsDir) {
  logsDir = logsDir || require('path').resolve(getUserHome(), './.proxymock/logs/');
  ensureDirExists(logsDir);

  const configure = {
    appenders: {
      console: { type: 'console' }
    },
    categories: { default: { appenders: ['console'], level: 'info' } }
  };

  _.forEach(loggerConf.level, function(level, category) {
    configure.appenders[category] = { type: 'file', filename: logsDir  + '/' + category + '.log', category: category, maxLogSize: 2048000, numBackups: 3, compress: true, encoding: 'utf-8' };
    configure.categories[category] = { appenders: [category], level: level || loggerConf.defaultLevel };
  });

  log4js.configure(configure);

  _.forEach(configure.appenders, function(appender, category) {
    logger[category] = log4js.getLogger(category);
    logger[category].level = loggerConf.level[category] || loggerConf.defaultLevel;
  });
}

/**
 * 设置日志打印级别, 若level为undefined, 则针对所有类别的日志设置打印级别
 * @param {String} category 日志类别
 * @param {String} level 打印级别
 */
exports.setLevel = (category, level) => {
  if (level) {
    logger.hasOwnProperty(category) && (logger[category].level = level);
  }
  else {
    level = category;
    for (category in logger) {
      logger.hasOwnProperty(category) && (logger[category].level = level);
    }
  }
}

exports.getLogger = (category) => {
  return logger[category];
}

exports.connect = (category, level) => {
  return log4js.connectLogger(exports.getLogger(category), level && { level: level });
}

initLogger();