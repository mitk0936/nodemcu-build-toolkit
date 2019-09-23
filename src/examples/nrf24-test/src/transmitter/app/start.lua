r = require('lib/nrf24')

r.nrf24_hw_init()
r.nrf24_init_node(function ()
  print('device ready')
	
	r.nrf24_stop_listening()
	r.nrf24_set_channel(50)
	r.nrf24_set_xmit_address({ 0xe1, 0xe1, 0xe1, 0xe1, 0xe1 })

	r.nrf24_set_dynamic_payload()

	r.nrf24_power_up()

	function packet()
		print ("xmit packet...");
		r.nrf24_send_packet({ 0x1, 0x2, 0x3, 0x4, 0x5 })
	end

	tmr.create():alarm(1000, tmr.ALARM_AUTO, packet);
end)
