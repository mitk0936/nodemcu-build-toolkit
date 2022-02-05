const printDebugMessage = (...messages) => console.log('\x1b[31m', [...messages].join('\n'));
const generateUploadOptions = ({ connectionDelay = 200, baud = 115200 }) => `--connection-delay ${connectionDelay} --baud ${baud}`;
const getStdOutLines = (stdout) => String(stdout).trim().split('\n');

const execRetry = (callback) => {
  try {
    callback();
  } catch (e) {
    console.log('exec sync failed, retrying...');
    setTimeout(function () {
      execRetry(callback);
    }, 1000);
  }
};

module.exports = {
  printDebugMessage,
  generateUploadOptions,
  getStdOutLines,
  execRetry
};
