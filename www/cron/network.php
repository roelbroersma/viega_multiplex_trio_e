<?php
	$start = time();
	$now = $start;
	$end = $now + 30;
	include("/www/inc/functions.php");
	include("/www/config/branding.php");

	$uptime = getUptime();
	file_put_contents("/var/log/lighttpd/uptime.txt", "Up: " . $uptime . "\n", FILE_APPEND);

	if($uptime > 1) {
		while ($now < $end) {
			netcheck($branding);
			$time = time() - $now;
			file_put_contents("/var/log/lighttpd/uptime.txt", (time() - $start) . " Runtime: " . $time . "\n", FILE_APPEND);
			sleep(15);
			$now = time();
		}
		file_put_contents("/var/log/lighttpd/uptime.txt", (time() - $start) . " done\n", FILE_APPEND);
	}

function trigger_led($times)
{
	for($i = 0; $i < $times; $i++)
	{
		exec("/bin/echo 1 > /sys/class/leds/carambola2:orange:eth1/brightness");
		usleep(200000);
		exec("/bin/echo 0 > /sys/class/leds/carambola2:orange:eth1/brightness");
		usleep(200000);
	}
}

function wifi_status()
{
	$out = shell_exec("/sbin/wifi status");
	$wlan = (array) json_decode($out);
	return($wlan);
}

function ssid_visible($ssid)
{
	$out = shell_exec("/usr/sbin/iwlist wlan0 scan | grep ESSID | grep \"" . escape_grep($ssid) . "\"");
	if(strpos($out, $ssid))
		return(1);
	else
		return(0);
}

function ping ($host, $timeout = 1) {
	/* ICMP ping packet with a pre-calculated checksum */
	$package = "\x08\x00\x7d\x4b\x00\x00\x00\x00PingHost";
	$socket = socket_create(AF_INET, SOCK_RAW, 1);
	socket_set_option($socket, SOL_SOCKET, SO_RCVTIMEO, array('sec' => $timeout, 'usec' => 0));
	socket_connect($socket, $host, null);

	$ts = microtime(true);
	socket_send($socket, $package, strLen($package), 0);
	if (socket_read($socket, 255))
		$result = microtime(true) - $ts;
	else
		$result = false;
	socket_close($socket);

	return $result;
}

function netcheck($branding)
{
	if (file_exists("/tmp/wlan-connect.txt")) {
		$time = time() - intval(file_get_contents("/tmp/wlan-connect.txt"));
		if ($time < 60)
			return;
	}

	$mode = network_mode();
	if (file_exists("/tmp/networkmode.txt"))
		$oldmode = intval(trim(file_get_contents("/tmp/networkmode.txt")));
	else
		$oldmode = 0;

	if (file_exists("/tmp/sta_counter.txt"))
		$sta = intval(trim(file_get_contents("/tmp/sta_counter.txt")));
	else
		$sta = 0;

	if (file_exists("/tmp/ap_counter.txt"))
		$ap = intval(trim(file_get_contents("/tmp/ap_counter.txt")));
	else
		$ap = 0;

	if ($mode != $oldmode)
		post_log($mode, "Switching from " . $oldmode . " to " . $mode);

	switch ($mode) {
		// Ethernet mode
		case 1:
			if (!wlan_state('ap'))
				wlan_ap(0);
			if (!wlan_state('sta'))
				wlan_sta(0);
			$sta = 0;
			$ap = 0;
			break;

		// AP mode without valid STA configuration
		case 2:
			// Did we switch from ethernet mode?
			if (wlan_state('ap'))
				wlan_ap(1, $branding['brlan']);
			if (!wlan_state('sta'))
				wlan_sta(0);
			$sta = 0;
			$ap = 0;
			break;

		// STA mode
		case 3:
			// Did we switch from ethernet mode?
			if (wlan_state('sta'))
				wlan_sta(1);
			if (!wlan_state('ap'))
				wlan_ap(0);
			$sta = 0;
			$ap = 0;
			break;

		// STA mode, but SSID not visible
		case 4:
			// Did we switch from ethernet mode?
			if (wlan_state('sta'))
				wlan_sta(1);
//			$ssid = get_sta_ssid();
//			if(wlan_search($ssid))
//			{
			// STA SSID is visible again
//				echo "Found STA SSID: " . $ssid . "\n";
//				wlan_sta(1);
//				wlan_ap(0);
//			}
//			else
//			{
			$sta++;
			if ($sta > 5) {
				wlan_sta(0);
				wlan_ap(1, $branding['brlan']);
				$sta = 0;
			}
//			}
			$ap = 0;
			break;

		// STA mode, SSID visible, but router not reachable
		case 5:
			// Did we switch from ethernet mode?
			if (wlan_state('sta'))
				wlan_sta(1);
			$sta++;
			if ($sta > 5) {
				post_log(5, "Restart WiFi");
				exec("/sbin/wifi reload");
//				$sta = 0;
			}
			if ($sta > 10) {
				$sta = 0;
				wlan_ap(1, $branding['brlan']);
				wlan_sta(0);
				post_log(5, "Switching to AP mode");
			}
			$ap = 0;
			break;

		// AP mode, previous STA SSID not visible
		case 6:
			// Did we switch from ethernet mode?
			if (wlan_state('ap'))
				wlan_ap(1, $branding['brlan']);
			if (!wlan_state('sta'))
				wlan_sta(0);
			$sta = 0;
			$ap++;
			if ($ap > 2) {
				$ssid = get_sta_ssid();
				if (wlan_search($ssid)) {
					// STA SSID is visible again
					echo "Found STA SSID: " . $ssid . "\n";
					wlan_sta(1);
					wlan_ap(0);
				}
//				$ap = 0;
			}
			break;
	}
	file_put_contents("/tmp/sta_counter.txt", $sta);
	file_put_contents("/tmp/ap_counter.txt", $ap);
	file_put_contents("/tmp/networkmode.txt", $mode);
}