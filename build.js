const cli = require('commander');
const prompt = require('prompt');
const currentProcess = require('child_process');
const serialport = require('serialport');
const path = require('path');

require('shelljs/global');

prompt.start();

const PATH_TO_SRC = './src';
const NODEMCU_TOOL = 'node_modules/nodemcu-tool/bin//nodemcu-tool';
const UPLOAD_CONFIG_NAME = 'upload.config.js';
const ESP_INIT_DATA_ADDRESSES = ['0x7c000', '0xfc000', '0x1fc000', '0x3fc000', '0x7fc000', '0xffc000'];
const FIRMWARE_ADDRESS = '0x00000';

const BOARDS_ADDRESSES = [
  '0x7c000 for 512 kB, modules like most ESP-01, -03, -07 etc.',
  '0xfc000 for 1 MB, modules like ESP8285, PSF-A85, some ESP-01, -03 etc.',
  '0x1fc000 for 2 MB',
  '0x3fc000 for 4 MB, modules like ESP-12E, NodeMCU devkit 1.0, WeMos D1 mini',
  '0x7fc000 for 8 MB',
  '0xffc000 for 16 MB, modules like WeMos D1 mini pro'
];

const printDebugMessage = (...messages) => console.log('\x1b[31m', [...messages].join('\n'));

const generateUploadOptions = ({ connectionDelay = 200, baud = 115200 }) => `--connection-delay ${connectionDelay} --baud ${baud}`;

const findPort = () => new Promise((resolve, reject) => {
  const portsFound = [];

  serialport.list((err, ports) => {
    if (err) {
      printDebugMessage('Error occured with finding connected device on USB port.');
      reject();
    }

    ports.forEach((port) => {
      if (port.serialNumber || port.manufacturer) {
        portsFound.push(port);
      }
    });

    switch (portsFound.length) {
      case 1:
        resolve(portsFound[0].comName);
        break
      case 0:
        printDebugMessage('No connected devices were found.');
        reject();
        break
      default:
        console.log('Select the device you want to work with:');
        
        portsFound.forEach((port, index) => {
          console.log(`${index})`, port.comName, 'Manufacturer', port.manufacturer, 'Serial Number: ', port.serialNumber);
        });

        prompt.get([{
          name: 'usb-connected-device-index',
          required: true
        }], (err, result) => {
          if (err) {
            printDebugMessage('Error with selecting device port.');
            reject();
          }

          const selectedIndex = parseInt(result['usb-connected-device-index']);
          resolve(portsFound[selectedIndex].comName);
        });
    }
  });
});

const selectAddress = () => new Promise((resolve, reject) => {
  ESP_INIT_DATA_ADDRESSES.forEach((address, index) => console.log(`${index}) ${BOARDS_ADDRESSES[index]}`));

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
  const allUploadConfigsFiles = ls(`${PATH_TO_SRC}/**/${UPLOAD_CONFIG_NAME}`);

  if (allUploadConfigsFiles.length === 0) {
    printDebugMessage('No upload.config.js file found in your src folder.');
    reject();
  }

  if (allUploadConfigsFiles.length === 1) {
    resolve(allUploadConfigsFiles[0]);
    return;
  }

  console.log('Please type the index of the file you want to use as upload.config.');
  allUploadConfigsFiles.forEach((path, index) => console.log(`${index}) ${path}`));

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
})

cli.command('mkfs').action(async () => {
  const port = await findPort();

  currentProcess
    .execSync(`node ${NODEMCU_TOOL} mkfs --port=${port} --connection-delay 500` , { stdio: 'inherit' });
});

cli.command('upload [prodFlag]').action(async (prodFlag) => {
  const prod = !!prodFlag && !!~prodFlag.indexOf('prod');
  const compilePrefix = prod ? '--compile' : '';
  const port = await findPort();

  const uploadConfigPath = await selectUploadConfig();
  const uploadConfigFolderPath = path.dirname(uploadConfigPath);
  const uploadConfig = require(uploadConfigPath);

  cd(uploadConfigFolderPath);

  const NODEMCU_TOOL_RELATIVE_PATH = path.relative(uploadConfigFolderPath, NODEMCU_TOOL);

  // TODO: validate source
  const { source = {} } = require(uploadConfigPath);
  const { libs = [], scripts = '', static = null } = source;

  const allFiles = ls(`${scripts}`).reduce((output, filename) => `${output} ${filename}`, '');
  const allStatic = static ? ls(`${static}`).reduce((output, filename) => `${output} ${filename}`) : null;
  console.log(JSON.stringify(uploadConfig));

  const uploadOptions = generateUploadOptions(uploadConfig);

  currentProcess
    .execSync(`node ${NODEMCU_TOOL_RELATIVE_PATH} upload ${allFiles} ${compilePrefix} --port=${port} ${uploadOptions} --keeppath`, { stdio: 'inherit' });
  
  if (static) {
    currentProcess
      .execSync(`node ${NODEMCU_TOOL_RELATIVE_PATH} upload ${allStatic} --port=${port} ${uploadOptions} --keeppath`, { stdio: 'inherit' });
  }

  libs.forEach((libPath) => {
    console.log('LIB', libPath);

    currentProcess
      .execSync(`node ${NODEMCU_TOOL_RELATIVE_PATH} upload ${libPath} --remotename lib/${path.basename(libPath)} ${compilePrefix} --port=${port} ${uploadOptions}`, { stdio: 'inherit' });
  });

  currentProcess
    .execSync(`node ${NODEMCU_TOOL_RELATIVE_PATH} upload init.lua --port=${port} ${uploadOptions}`, { stdio: 'inherit' });

  currentProcess
    .execSync(`node ${NODEMCU_TOOL_RELATIVE_PATH} fsinfo --port=${port}`, { stdio: 'inherit' });

  printDebugMessage('DONE');
});

cli.command('start').action(async () => {
  const port = await findPort();

  currentProcess
    .execSync(`node ${NODEMCU_TOOL} reset --port=${port}`);

  currentProcess
    .execSync(`node ${NODEMCU_TOOL} terminal --port=${port}`, { stdio: 'inherit' });
});

cli.command('flash [folder] [mode]').action((folder, mode) => {
  const folderPath = folder || 'firmware';
  const flashMode = mode || 'qio';

  console.log('Searching for firmware files...');
  
  const binariesFound = ls('**/*.bin');

  if (binariesFound.length) {
    console.log('Please type the index of the binary you want to flash as firmware.');
  } else {
    printDebugMessage('No binaries found in your project folder');
    return;
  }

  binariesFound.forEach((file, index) => console.log(`${index}) ${file}`));

  prompt.get([{
    name: 'binary-flash-index',
    required: true
  }], async (err, result) => {
    const selectedIndex = parseInt(result['binary-flash-index']);

    if (err || !binariesFound[selectedIndex]) {
      printDebugMessage('Error with selecting binary flash index.');
      return;
    }

    console.log('Please choose memory address for the esp_init_data_default binary to flash on:');

    const address = await selectAddress();
    const port = await findPort();

    try {
      console.log('Flashing: ' + binariesFound[selectedIndex], ' on address: ', address, '...');
      console.log('Erasing previous flash...');

      currentProcess
        .execSync(`esptool.py --port ${port} erase_flash`, { stdio: 'inherit' });

      console.log(`Flashing esp_init_data_default.bin at ${port}`);

      currentProcess
        .execSync(
          `esptool.py --port ${port} write_flash -fm ${flashMode} ${address} firmware/esp_init_data_default.bin`,
          { stdio: 'inherit' }
        );

      console.log(`Flashing ${binariesFound[selectedIndex]} at ${FIRMWARE_ADDRESS}`);

      currentProcess
        .execSync(
          `esptool.py --port ${port} --before default_reset --baud 115200 write_flash -fm ${flashMode} ${FIRMWARE_ADDRESS} ${binariesFound[selectedIndex]}`,
          { stdio: 'inherit' }
        );
      } catch (e) {
        printDebugMessage(
          'Problem with flashing firmware',
          'Make sure you have esptool installed and configured on your machine',
          'Check https://github.com/espressif/esptool',
          e.message
        );
      }
  });
});

cli.command('*').action( function(c){
  console.error('Unknown command "' + c + '"');
  cli.outputHelp();
});

cli.parse(process.argv);
