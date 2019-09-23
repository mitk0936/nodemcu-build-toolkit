module.exports = {
  connectionDelay: 100,
  baud: 115200,
  source: {
    libs: [
      '../../nodemcu-nrf24/nrf24.lua'
    ],
    scripts: './app/*.lua'
  }
};