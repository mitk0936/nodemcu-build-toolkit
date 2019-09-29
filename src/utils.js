const printDebugMessage = (...messages) => console.log('\x1b[31m', [...messages].join('\n'));
const generateUploadOptions = ({ connectionDelay = 200, baud = 115200 }) => `--connection-delay ${connectionDelay} --baud ${baud}`;
const getStdOutLines = (stdout) => String(stdout).trim().split('\n');

module.exports = {
  printDebugMessage,
  generateUploadOptions,
  getStdOutLines
};