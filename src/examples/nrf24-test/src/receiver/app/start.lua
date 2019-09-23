print(node.heap());
r = require('lib/nrf24');

r.nrf24_hw_init()
r.nrf24_init_node(function ()
  print('device is ready')

	r.nrf24_stop_listening()
	r.nrf24_set_channel(50)
	r.nrf24_set_dynamic_payload()
	r.nrf24_set_recv_address({ 0xe1, 0xe1, 0xe1, 0xe1, 0xe1 })

	r.nrf24_start_listening()

	function receiver()
		ready = r.nrf24_data_available()

		if (ready > 0) then
			data = r.nrf24_data_read()
			print(unpack(data))
		end
	end

	tmr.create():alarm(100, tmr.ALARM_AUTO, receiver)
end)
