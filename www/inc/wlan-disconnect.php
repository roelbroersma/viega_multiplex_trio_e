<?php
	include("/www/config/branding.php");

	if ($_SERVER['REQUEST_METHOD'] === 'POST')
	{
	exec("/usr/bin/sudo /sbin/uci set wireless.@wifi-iface[0].ssid=SSID");
	exec("/usr/bin/sudo /sbin/uci set wireless.@wifi-iface[0].key=KEY");
	exec("/usr/bin/sudo /sbin/uci set wireless.@wifi-iface[0].disabled=1");
	exec("/usr/bin/sudo /sbin/uci set wireless.@wifi-iface[1].disabled=0");
	exec("/usr/bin/sudo /sbin/uci set network.lan.ipaddr=" . $branding['brlan']);
	exec("/usr/bin/sudo /sbin/uci commit");
		exec('/usr/bin/sudo /sbin/wifi reload');
		$array['status'] = 200;
	}
	else
		$array['status'] = 403;

	header('Content-Type: application/json');
	echo json_encode($array);
?>