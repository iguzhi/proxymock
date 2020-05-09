const start = require('../index');


start({
  router: {
    
  }
});


process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err)
});

process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection', err)
});