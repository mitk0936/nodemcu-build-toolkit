local ms = require('lib/moon_saga');
local services = require('app/services');

local start_app = function()
  local ok, config = services.read_file('static/config.json');

  if (ok) then
    services.wifi_config(config);

    local ok, ip = coroutine.yield(
      ms.resolve(services.wifi_connect, 2000, config.wifi.ssid)
    );

    if (ok) then
      print('Connected, IP is '..ip);
      ms.dispatch('WIFI_CONNECTED', ip);
    end
  else
    print('cannot open config');
  end
end

ms.moon_saga(start_app);