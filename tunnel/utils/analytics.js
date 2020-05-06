const ua = require('universal-analytics');
const { v4: uuid } = require('uuid');
const { JSONStorage } = require('node-localstorage');
const appData = require('app-data-folder');
const os = require('os');
const packageJson = require('../../package.json')
const isDocker = require('is-docker');

const nodeStorage = new JSONStorage(appData('greentunnel'));
const userId = nodeStorage.getItem('userid') || uuid();
nodeStorage.setItem('userid', userId);

var visitor = ua('UA-160385585-1', userId);

exports.appInit = function (source = 'OTHER') {
  const osPlatform = os.platform() + (isDocker() ? '-docker' : '')

  visitor.set('version', packageJson.version);
  visitor.set('os', osPlatform);
  visitor.set('source', source);

  visitor.event('gt-total', 'init').send();
  visitor.event(`gt-${source}`, 'init').send();
  visitor.event(`gt-${osPlatform}`, 'init').send();
  visitor.event(`gt-${packageJson.version}`, 'init').send();
}
