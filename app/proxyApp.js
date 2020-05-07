const { setProxy, unsetProxy } = require('../lib/proxy/systemProxy');
const express = require('express');
const cors = require('cors');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const portfinder = require('portfinder');
const Proxy = require('../tunnel/proxy');

/**
 * create server
 * @param {Integer} port 
 * @param {Object} router 
 * {
 *    'POST /user': function(req, res, next) {},
 *    'GET /session': function(req, res, next) {}
 * }
 */
function createServer({ httpPort, httpsPort, router = {} }) {
  
}

module.exports = ({ router }) => {
  let px;

  portfinder.getPortPromise({
    port: 8000,    // minimum port
    stopPort: 9999 // maximum port
  })
  .then((port) => {
    //
    // `port` is guaranteed to be a free port
    // in this scope.
    //
    // createProxyServer(port);
    // const result = setProxy('127.0.0.1', port);
    // console.log(result.status === 0 ? `启动代理成功(127.0.0.1:${port})` : result.stderr);
    px = new Proxy({
      port,
      dns: {
        type: 'https'
      }
    });
    px.start({setProxy: true})
  })
  .catch((err) => {
    //
    // Could not get a free port, `err` contains the reason.
    //
    console.error('[Error PortFinder]', err);
  });

  process.on('SIGINT', function () {
    px && px.stop();
    process.exit();
  });

  process.on('uncaughtException', function (e) {
    console.error('uncaughtException: ', e);
  });

  process.on('unhandledRejection', function (e) {
    console.error('unhandledRejection: ', e);
  });
}


