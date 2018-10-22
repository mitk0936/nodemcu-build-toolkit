module.exports = {
  connectionDelay: 200,
  baud: 115200,
  source: {
    libs: ['../lib/moon_saga.lua'],
    scripts: './app/*.lua',
    static: './static/**/*.{json,html}'
  }
};
