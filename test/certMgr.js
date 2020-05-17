const certMgr = require('../lib/utils/certMgr');
// const EasyCert = require('node-easy-cert');
// const util = require('../lib/utils/util');

(async () => {
  const data = await certMgr.generateRootCA(true);
  console.log(data);
})();


// console.log(bbb.next())
// (async() => {
//   let a = await certMgr.trustRootCA()
//   // let a = await certMgr.getCAStatus()
//   console.log(a);

// })()
