const fs = require('fs');
const path = require('path');

exports.execScriptSync = function (cmd) {
  let stdout,
    status = 0;
  try {
    stdout = child_process.execSync(cmd);
  }
  catch (err) {
    stdout = err.stdout;
    status = err.status;
  }

  return {
    stdout: stdout.toString(),
    status
  };
};

exports.getProxyMockPath = (pathName) => {
  const home = exports.getProxyMockHome();
  const targetPath = path.join(home, pathName);
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath);
  }
  return targetPath;
}

// unused
exports.getFreePort = () => {
  return new Promise((resolve, reject) => {
    const server = require('net').createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });
  });
}

exports.getUserHome = () => {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

exports.getProxyMockHome = () => {
  const home = path.join(exports.getUserHome(), '/.proxymock/');
  if (!fs.existsSync(home)) {
    fs.mkdirSync(home);
  }
  return home;
}

exports.formatDate = function (date, formatter) {
  if (typeof date !== 'object') {
    date = new Date(date);
  }
  const transform = function (value) {
    return value < 10 ? '0' + value : value;
  };
  return formatter.replace(/^YYYY|MM|DD|hh|mm|ss/g, (match) => {
    switch (match) {
      case 'YYYY':
        return transform(date.getFullYear());
      case 'MM':
        return transform(date.getMonth() + 1);
      case 'mm':
        return transform(date.getMinutes());
      case 'DD':
        return transform(date.getDate());
      case 'hh':
        return transform(date.getHours());
      case 'ss':
        return transform(date.getSeconds());
      default:
        return ''
    }
  });
}

exports.isIp = (domain) => {
  if (!domain) {
    return false;
  }
  const ipReg = /^\d+?\.\d+?\.\d+?\.\d+?$/;

  return ipReg.test(domain);
}

exports.deleteFolderContentsRecursive = (dirPath, ifClearFolderItself) => {
  if (!dirPath.trim() || dirPath === '/') {
    throw new Error('can_not_delete_this_dir');
  }

  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        exports.deleteFolderContentsRecursive(curPath, true);
      } else { // delete all files
        fs.unlinkSync(curPath);
      }
    });

    if (ifClearFolderItself) {
      try {
        // ref: https://github.com/shelljs/shelljs/issues/49
        const start = Date.now();
        while (true) {
          try {
            fs.rmdirSync(dirPath);
            break;
          }
          catch (er) {
            if (process.platform === 'win32' && (er.code === 'ENOTEMPTY' || er.code === 'EBUSY' || er.code === 'EPERM')) {
              // Retry on windows, sometimes it takes a little time before all the files in the directory are gone
              if (Date.now() - start > 1000) throw er;
            }
            else if (er.code === 'ENOENT') {
              break;
            }
            else {
              throw er;
            }
          }
        }
      }
      catch (e) {
        throw new Error('could not remove directory (code ' + e.code + '): ' + dirPath);
      }
    }
  }
}

exports.guideToHomePage = function () {
  console.info('[proxymock] Refer to https://github.com/iguzhi/proxymock/blob/master/README.md for more detail');
}
