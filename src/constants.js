const ESP_INIT_DATA_ADDRESSES = ['0x7c000', '0xfc000', '0x1fc000', '0x3fc000', '0x7fc000', '0xffc000'];
const FIRMWARE_ADDRESS = '0x00000';

const PATH_FROM_INDEX_TO_SRC = './';

const BOARDS_ADDRESSES = {
  '0x7c000': '0x7c000 for 512 kB, modules like most ESP-01, -03, -07 etc.',
  '0xfc000': '0xfc000 for 1 MB, modules like ESP8285, PSF-A85, some ESP-01, -03 etc.',
  '0x1fc000': '0x1fc000 for 2 MB',
  '0x3fc000': '0x3fc000 for 4 MB, modules like ESP-12E, NodeMCU devkit 1.0, WeMos D1 mini',
  '0x7fc000': '0x7fc000 for 8 MB',
  '0xffc000': '0xffc000 for 16 MB, modules like WeMos D1 mini pro'
};

const UPLOAD_CONFIG_NAME = 'upload.config.js';
const INIT_LUA_NAME = 'init.lua';

module.exports = {
  ESP_INIT_DATA_ADDRESSES,
  FIRMWARE_ADDRESS,
  BOARDS_ADDRESSES,
  UPLOAD_CONFIG_NAME,
  INIT_LUA_NAME
};