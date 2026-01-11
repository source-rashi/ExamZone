const originalExit = process.exit;
process.exit = function(code) {
  console.error(`\n process.exit() called with code: ${code}`);
  console.trace('Exit trace:');
  originalExit.call(process, code);
};

process.on('uncaughtException', (err) => {
  console.error('\n UNCAUGHT EXCEPTION:', err);
  console.trace();
});

process.on('unhandledRejection', (reason) => {
  console.error('\n UNHANDLED REJECTION:', reason);
  console.trace();
});

require('./server.js');
