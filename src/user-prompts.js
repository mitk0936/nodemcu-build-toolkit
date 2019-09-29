const serialport = require('serialport');
const prompt = require('prompt');
const { ls } = require('shelljs');

prompt.start();

const { printDebugMessage } = require('./utils');
const { ESP_INIT_DATA_ADDRESSES, BOARDS_ADDRESSES, UPLOAD_CONFIG_NAME } = require('./constants');

const selectPort = () => new Promise((resolve, reject) => {
  serialport.list((err, ports) => {
    if (err) {
      printDebugMessage('Error occured with finding connected device on USB port.');
      reject();
    }

    const portsFound = ports.filter((port) => Boolean(port.serialNumber || port.manufacturer));

    switch (portsFound.length) {
      case 1:
        resolve(portsFound[0].comName);
        break
      case 0:
        printDebugMessage('No connected devices were found.');
        break;
      default:
        console.log('Select the device you want to work with:');
        
        portsFound.forEach((port, index) => {
          console.log(`[${index}]`, port.comName, 'Manufacturer', port.manufacturer, 'Serial Number: ', port.serialNumber);
        });

        prompt.get([{
          name: 'usb-connected-device-index',
          required: true
        }], (err, result) => {
          if (err) {
            printDebugMessage('Error with selecting device port.');
          }

          const selectedIndex = parseInt(result['usb-connected-device-index']);
          resolve(portsFound[selectedIndex].comName);
        });
    }
  });
});

const selectAddress = () => new Promise((resolve, reject) => {
  ESP_INIT_DATA_ADDRESSES.forEach((address, index) => console.log(`[${index}] ${BOARDS_ADDRESSES[address]}`));

  prompt.get([{
    name: 'binary-flash-address-index',
    required: true
  }], (err, result) => {
    if (err) {
      printDebugMessage('Error with selecting memory address');
      reject();
    }

    const selectedIndex = parseInt(result['binary-flash-address-index']);
    resolve(ESP_INIT_DATA_ADDRESSES[selectedIndex]);
  });
});

const selectUploadConfig = () => new Promise((resolve, reject) => {
  const allUploadConfigsFiles = ls(`./**/${UPLOAD_CONFIG_NAME}`);

  if (allUploadConfigsFiles.length === 0) {
    printDebugMessage('No upload.config.js file found in your src folder.');
    reject();
  }

  if (allUploadConfigsFiles.length === 1) {
    resolve(allUploadConfigsFiles[0]);
    return;
  }

  console.log('Please type the index of the file you want to use as upload.config.');
  allUploadConfigsFiles.forEach((path, index) => console.log(`[${index}] ${path}`));

  prompt.get([{
    name: 'upload-config-index',
    required: true
  }], (err, result) => {
    if (err) {
      printDebugMessage(`Error with selecting ${UPLOAD_CONFIG_NAME} file.`);
      reject();
    }

    const selectedIndex = parseInt(result['upload-config-index']);
    resolve(allUploadConfigsFiles[selectedIndex]);
  });
});

const selectFirmwareBinary = () => new Promise((resolve) => {
  console.log('Searching for firmware files...');
  
  const binaryFilesFound = ls('**/*.bin');

  if (binaryFilesFound.length > 0) {
    binaryFilesFound.forEach((binaryFile, index) => console.log(`[${index}] ${binaryFile}`));
  
    prompt.get([{
      name: 'binary-flash-index',
      required: true
    }], async (err, result) => {
      const selectedIndex = parseInt(result['binary-flash-index']);

      if (err || !binaryFilesFound[selectedIndex]) {
        return printDebugMessage('Error with selecting binary flash index.');
      }

      resolve(binaryFilesFound[selectedIndex]);
    });
  } else {
    return printDebugMessage('No binaries found in your project folder.');
  }
});

module.exports = {
  selectPort,
  selectAddress,
  selectUploadConfig,
  selectFirmwareBinary
};