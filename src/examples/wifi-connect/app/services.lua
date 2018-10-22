local utils = require('app/utils');

local read_file = function (filename)
  if (file.open(filename)) then
    -- WARN: In newest firmware version -> sjson
    local decoded, content = pcall(cjson.decode, file.read());
    file.close();
    return decoded, content;
  end

  return false, nil;
end

local wifi_config = function (config)
  -- setup wifi 
  wifi.setmode(wifi.STATIONAP);
  -- WARN: In newest firmware version -> { ssid = config.wifi.ssid, pwd = config.wifi.pwd or '' }
  wifi.sta.config(config.wifi.ssid, config.wifi.pwd);
  wifi.ap.config({ ssid = config.ap.ssid, pwd = config.ap.pwd });
  wifi.sta.connect();
end

local wifi_connect = function (resolve, reject, interval, ssid)
  tmr.alarm(1, interval or 1500, 1, function()
    if wifi.sta.getip() == nil then
      print('Connecting...', ssid);
    else
      tmr.stop(1);
      resolve(wifi.sta.getip());
    end
  end)
end

return {
  read_file = read_file,
  wifi_config = wifi_config,
  wifi_connect = wifi_connect
};