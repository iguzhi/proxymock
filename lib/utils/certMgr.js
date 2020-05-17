'use strict'

const EasyCert = require('node-cert'); // forked from node-easy-cert which done some fix
const os = require('os');
const inquirer = require('inquirer');
const _ = require('lodash');
const util = require('./util');
const { getLogger } = require('./logger');
const certLogger = getLogger('cert');

const options = {
  rootDirPath: util.getProxyMockPath('certificates'),
  inMemory: false,
  defaultCertAttrs: [
    { name: 'countryName', value: 'CN' },
    { name: 'organizationName', value: 'ProxyMock' },
    { shortName: 'ST', value: 'NJ' },
    { shortName: 'OU', value: 'ProxyMock SSL Proxy' }
  ]
};

const easyCert = new EasyCert(options);
const crtMgr = _.merge({}, easyCert);

// rename function
crtMgr.ifRootCAFileExists = easyCert.isRootCAFileExists;

crtMgr.generateRootCA = (overwrite) => {
  const rootOptions = {
    commonName: 'DO NOT TRUST PROXYMOCK ROOT CA',
    overwrite: !!overwrite
  };

  return new Promise((resolve, reject) => {
    easyCert.generateRootCA(rootOptions, (error, keyPath, crtPath) => {
      if (error) {
        reject(error);
      }
      resolve({ keyPath, crtPath});
    });
  });
};

crtMgr.getCAStatus = () => {
  const result = {
    exist: false,
  };
  const ifExist = easyCert.isRootCAFileExists();
  if (!ifExist) {
    return result;
  }
  else {
    result.exist = true;
    if (!/^win/.test(process.platform)) {
      result.trusted = easyCert.ifRootCATrusted()// yield easyCert.ifRootCATrusted;
    }
    return result;
  }
}

/**
 * trust the root ca by command
 */
crtMgr.trustRootCA = async () => {
  const platform = os.platform();
  const rootCAPath = crtMgr.getRootCAFilePath();
  const trustInquiry = [
    {
      type: 'list',
      name: 'trustCA',
      message: 'The rootCA is not trusted yet, install it to the trust store now?',
      choices: ['Yes', "No, I'll do it myself"]
    }
  ];

  if (platform === 'darwin') {
    const answer = await inquirer.prompt(trustInquiry);
    if (answer.trustCA === 'Yes') {
      console.info('[proxymock] About to trust the root CA, this may requires your password');
      certLogger.info('[proxymock] About to trust the root CA, this may requires your password');
      // https://ss64.com/osx/security-cert.html
      const result = util.execScriptSync(`sudo security add-trusted-cert -d -k /Library/Keychains/System.keychain ${rootCAPath}`);
      if (result.status === 0) {
        console.info('[proxymock] Root CA install, you are ready to intercept the https now');
        certLogger.info('[proxymock] Root CA install, you are ready to intercept the https now');
      }
      else {
        console.error('[proxymock] Failed to trust the root CA, please trust it manually', result);
        certLogger.error('[proxymock] Failed to trust the root CA, please trust it manually');
        util.guideToHomePage();
      }
    }
    else {
      console.info('[proxymock] Please trust the root CA manually so https interception works');
      certLogger.info('[proxymock] Please trust the root CA manually so https interception works');
      util.guideToHomePage();
    }
  }


  if (/^win/.test(process.platform)) {
    console.info('[proxymock] You can install the root CA manually.');
    certLogger.info('[proxymock] You can install the root CA manually.');
  }
  console.info('[proxymock] The root CA file path is: ' + crtMgr.getRootCAFilePath());
  certLogger.info('[proxymock] The root CA file path is: ' + crtMgr.getRootCAFilePath());
}

module.exports = crtMgr;
