const commander = require('commander');
const childProcess = require('child_process');
const path = require('path');
const { ls } = require('shelljs');

const { selectPort, selectAddress, selectUploadConfig, selectFirmwareBinary } = require('./user-prompts');
const { FIRMWARE_ADDRESS, INIT_LUA_NAME } = require('./constants');
const { printDebugMessage, generateUploadOptions } = require('./utils');

// const NODEMCU_TOOL = './node_modules/nodemcu-tool/bin/nodemcu-tool';
const NODEMCU_TOOL = './NodeMCU-Tool/bin/nodemcu-tool';

commander.command('mkfs').action(async () => {
  const port = await selectPort();

  childProcess
    .execSync(`node ${NODEMCU_TOOL} mkfs --port=${port} --connection-delay 500` , { stdio: 'inherit' });
});

commander.command('upload [prodFlag]').action(async (prodFlag) => {
  const prod = !!prodFlag && !!~prodFlag.indexOf('prod');
  const compilePrefix = prod ? '--compile' : '';
  const port = await selectPort();

  const pathFromProcessToUploadConfigFile = await selectUploadConfig();
  const relativePathToUploadConfig = path.relative(__dirname, pathFromProcessToUploadConfigFile);
  const uploadConfigDirName = path.dirname(pathFromProcessToUploadConfigFile);

  const uploadConfig = require(`./${relativePathToUploadConfig}`);

  console.log('\r\n Upload config \r\n');
  console.log(JSON.stringify(uploadConfig, null, 4));

  // TODO: validate source
  const { source = {} } = uploadConfig;
  const { libs = [], scripts = '', static = null } = source;

  const scriptsPath = path.join(
    uploadConfigDirName,
    scripts
  );

  const staticFilesPath = static && path.join(
    uploadConfigDirName,
    static
  );
  
  const allFiles = ls(scriptsPath);
  const allStatic = static && ls(staticFilesPath);

  const initLuaPath = path.join(
    uploadConfigDirName,
    INIT_LUA_NAME
  );

  const uploadOptions = generateUploadOptions(uploadConfig);

  const uploadFile = (file, compilePrefix = '') => {
    const fileNameOnDevice = path.relative(uploadConfigDirName, file);

    childProcess
      .execSync(`node ${NODEMCU_TOOL} upload ${file} --remotename ${fileNameOnDevice} ${compilePrefix} --port=${port} ${uploadOptions}`, { stdio: 'inherit' });
  };

  allFiles.forEach((file) => uploadFile(file, compilePrefix));

  if (static) {
    allStatic.forEach((staticFile) => uploadFile(staticFile));
  }

  libs.forEach((libPath) => {
    const lib = path.join(
      uploadConfigDirName,
      libPath
    );

    childProcess
      .execSync(`node ${NODEMCU_TOOL} upload ${lib} --remotename lib/${path.basename(lib)} ${compilePrefix} --port=${port} ${uploadOptions}`, { stdio: 'inherit' });
  });

  childProcess
    .execSync(`node ${NODEMCU_TOOL} upload ${initLuaPath} --port=${port} ${uploadOptions}`, { stdio: 'inherit' });

  childProcess
    .execSync(`node ${NODEMCU_TOOL} fsinfo --port=${port}`, { stdio: 'inherit' });

  printDebugMessage('DONE');
});

commander.command('start').action(async () => {
  const port = await selectPort();

  childProcess
    .execSync(`node ${NODEMCU_TOOL} reset --port=${port}`);

  childProcess
    .execSync(`node ${NODEMCU_TOOL} terminal --port=${port}`, { stdio: 'inherit' });
});

commander.command('flash [folder] [mode]').action(async (folder, mode) => {
  const folderPath = folder || 'firmware';
  const flashMode = mode || 'qio';

  const selectedBinaryFirmware = await selectFirmwareBinary();

  printDebugMessage('Please make sure, that your device is in flash mode.');

  console.log('Please choose memory address for the esp_init_data_default binary to flash on:');

  const address = await selectAddress();
  const port = await selectPort();

  try {
    console.log(`Flashing: ${selectedBinaryFirmware} on address: ${address}...`);
    console.log('Erasing previous flash...');

    childProcess
      .execSync(`esptool.py --port ${port} erase_flash`, { stdio: 'inherit' });

    console.log(`Flashing esp_init_data_default.bin at ${port}`);

    childProcess
      .execSync(
        `esptool.py --port ${port} write_flash -fm ${flashMode} ${address} firmware/esp_init_data_default.bin`,
        { stdio: 'inherit' }
      );

    console.log(`Flashing ${selectedBinaryFirmware} at ${FIRMWARE_ADDRESS}`);

    childProcess
      .execSync(
        `esptool.py --port ${port} --before default_reset --baud 115200 write_flash -fm ${flashMode} ${FIRMWARE_ADDRESS} ${selectedBinaryFirmware}`,
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

commander.command('*').action( function(c){
  console.error('Unknown command "' + c + '"');
  cli.outputHelp();
});

commander.parse(process.argv);
