<?php
	include("/www/inc/functions.php");
	include("/www/config/branding.php");

	exec('/usr/sbin/fw_printenv serialnum', $iot);
	$serialiot = explode("=", $iot[0]);
	$serialiot = trim($serialiot[1]);
	if(!$serialiot)
		$serialiot = 'none';

	exec('/usr/sbin/fw_printenv passwd', $result);
	$key = explode('=', $result[0]);

	if(strlen($key[1]) > 7)
		$password = $key[1];
	else
		$password = "12341234";

	// Check if we have an older WLAN configuration
	$out = trim(shell_exec("/sbin/uci get wireless.@wifi-iface[1].mode"));
	switch($out)
	{
		case "ap":
		case "sta":
			echo "We have a new WLAN config file\n";
			check_wlan();
			break;
		default:
			echo "We need to modify WLAN config to new version\n";
			change_wlan($branding, $serialiot, $password);
			break;
	}
	exec("/sbin/uci set wireless.radio0.disabled=0");
	exec("/sbin/uci set wireless.@wifi-iface[1].ssid=" . $branding['ssid'] . $serialiot);
	exec("/sbin/uci set wireless.@wifi-iface[1].key=" . $password);
	exec("/sbin/uci set wireless.@wifi-iface[1].disabled=0");
	exec("/sbin/uci commit");
	exec("/sbin/wifi reload");


	function change_wlan($branding, $serialiot, $wlankey)
	{

		exec("/sbin/uci set wireless.@wifi-iface[0].mode=sta");
		exec("/sbin/uci set wireless.@wifi-iface[0].network=wwan");

		$ssid = trim(shell_exec("/sbin/uci get wireless.@wifi-iface[0].ssid"));
		if(strpos($ssid, 'smart-') !== false)
		{
			// Remove old initial AP mode configuration
			exec("/sbin/uci set wireless.@wifi-iface[0].ssid='SSID'");
			exec("/sbin/uci set wireless.@wifi-iface[0].key='KEY'");
			exec("/sbin/uci set wireless.@wifi-iface[0].mode=sta");
			exec("/sbin/uci set wireless.@wifi-iface[0].encryption=psk2");
			exec("/sbin/uci set wireless.@wifi-iface[0].disabled=1");
		}

		$out = trim(shell_exec("/sbin/uci get wireless.@wifi-iface[0].disabled"));
		switch($out)
		{
			case "0":
			case "1":
				echo "Do nothing";
				break;
			default:
				exec("/sbin/uci set wireless.@wifi-iface[0].disabled=0");
		}

		exec("/sbin/uci add wireless wifi-iface");
		exec("/sbin/uci set wireless.@wifi-iface[1].device=radio0");
		exec("/sbin/uci set wireless.@wifi-iface[1].network=lan");
		exec("/sbin/uci set wireless.@wifi-iface[1].mode=ap");
		exec("/sbin/uci set wireless.@wifi-iface[1].ssid=" . $branding['ssid'] . $serialiot);
		exec("/sbin/uci set wireless.@wifi-iface[1].encryption=psk2");
		exec("/sbin/uci set wireless.@wifi-iface[1].key=" . $wlankey);
		exec("/sbin/uci set wireless.@wifi-iface[1].disabled=0");
	}

	function check_wlan()
	{
		$ssid = trim(shell_exec("/sbin/uci get wireless.@wifi-iface[0].ssid"));
		echo "Configured STA SSID: " . $ssid . "\n";
		if($ssid == "OpenWrt")
		{
			// Remove old initial AP mode configuration
			exec("/sbin/uci set wireless.@wifi-iface[0].ssid='SSID'");
			exec("/sbin/uci set wireless.@wifi-iface[0].key='KEY'");
			exec("/sbin/uci set wireless.@wifi-iface[0].encryption=psk2");
			exec("/sbin/uci set wireless.@wifi-iface[0].mode=sta");
		}
		$ssid = get_sta_ssid();
		if(!wlan_search($ssid))
		{
			// Disable STA mode when SSID is not found during startup
			exec("/sbin/uci set wireless.@wifi-iface[0].disabled=1");
		}
	}
