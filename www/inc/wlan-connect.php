<?php
    file_put_contents("/tmp/wlan-connect.txt", time());
	$data = $_POST;

	file_put_contents("/var/log/lighttpd/headers.txt", print_r(getallheaders(), true));
//	if(!check_token())
//		exit;

	$sta_disabled = intval(shell_exec("/usr/bin/sudo /sbin/uci get wireless.@wifi-iface[0].disabled"));
	if(!$sta_disabled)
	{
		// We want to connect to another WLAN network, so store old configuration just in case
		$old_ssid = trim(shell_exec("/usr/bin/sudo /sbin/uci get wireless.@wifi-iface[0].ssid"));
		$old_key = trim(shell_exec("/usr/bin/sudo /sbin/uci get wireless.@wifi-iface[0].key"));
	}
	exec("/usr/bin/sudo /sbin/uci set wireless.@wifi-iface[0].ssid='" . escape_uci($data['name']) . "'");
    exec("/usr/bin/sudo /sbin/uci set wireless.@wifi-iface[0].key='" . escape_uci($data['password']) . "'");
	exec("/usr/bin/sudo /sbin/uci set wireless.@wifi-iface[0].encryption=psk2");
	exec("/usr/bin/sudo /sbin/uci set wireless.@wifi-iface[0].disabled=0");

	exec("/usr/bin/sudo /sbin/uci commit");
	exec('/usr/bin/sudo /sbin/wifi reload');

	$status = "FAILED";

	for($i = 0; $i < 15; $i++)
	{
		sleep(2);
		exec("/usr/bin/sudo /usr/sbin/wpa_cli status", $output, $return);
		flush();
		foreach($output as $line)
		{
			if(preg_match("/^wpa_state/", $line))
			{
				$state = explode("=", $line);
				if($state[1] == "COMPLETED")
				{
					$status = "CONNECTED";
					$i = 20;
					break;
				}
				else
					$status = "FAILED";
			}
		}

		$output = array();
	}

	if($status == "CONNECTED")
	{
		$array['status'] = $status;
		$array['message'] = "Test";
		header('Content-Type: application/json');
		echo json_encode($array);
		flush();
		include("/www/config/branding.php");
//		exec("/usr/bin/sudo /sbin/uci set wireless.@wifi-iface[1].disabled=1");
		// when WLAN AP unused, set to 1.1.1.1 always
		exec("/usr/bin/sudo /sbin/uci set network.lan.ipaddr=1.1.1.1");
		exec("/usr/bin/sudo /sbin/uci commit");
//		exec('/usr/bin/sudo /sbin/wifi reload');
	}
	else
	{
		$array['status'] = "FAILED";
		$array['message'] = "Test";
		header('Content-Type: application/json');
		echo json_encode($array);
		flush();
		if($sta_disabled)
		{
			// No active old WLAN STA configuration
			exec("/usr/bin/sudo /sbin/uci set wireless.@wifi-iface[0].ssid=SSID");
			exec("/usr/bin/sudo /sbin/uci set wireless.@wifi-iface[0].key=KEY");
			exec("/usr/bin/sudo /sbin/uci set wireless.@wifi-iface[0].encryption=psk2");
			exec("/usr/bin/sudo /sbin/uci set wireless.@wifi-iface[0].disabled=1");
		}
		else
		{
			if($old_ssid != "SSID")
			{
				exec("/usr/bin/sudo /sbin/uci set wireless.@wifi-iface[0].ssid='" . escape_uci($old_ssid) . "'");
				exec("/usr/bin/sudo /sbin/uci set wireless.@wifi-iface[0].key='" . escape_uci($old_key) . "'");
				exec("/usr/bin/sudo /sbin/uci set wireless.@wifi-iface[0].encryption=psk2");
				exec("/usr/bin/sudo /sbin/uci set wireless.@wifi-iface[0].disabled=0");
			}
			else
			{
				// No active old WLAN STA configuration
				exec("/usr/bin/sudo /sbin/uci set wireless.@wifi-iface[0].ssid=SSID");
				exec("/usr/bin/sudo /sbin/uci set wireless.@wifi-iface[0].key=KEY");
				exec("/usr/bin/sudo /sbin/uci set wireless.@wifi-iface[0].encryption=psk2");
				exec("/usr/bin/sudo /sbin/uci set wireless.@wifi-iface[0].disabled=1");
			}
		}
		exec("/usr/bin/sudo /sbin/uci commit");
		exec('/usr/bin/sudo /sbin/wifi reload');
	}
//	exec("/bin/rm /tmp/wlan-connect");
?>
