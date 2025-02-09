<?php
	if($_POST)
		file_put_contents("/tmp/log/lighttpd/tlc-post.txt", print_r($_POST, true));

	switch($size)
	{
		case 1:
			// We are just called with /tlc/ without an ID
			get_all_tlcs();
			break;

		case 2:
			if($_POST)
			{
				$data = print_r($_POST, true);
				file_put_contents('/tmp/log/lighttpd/tlcupdate.txt', $data);
				file_put_contents("/tmp/log/lighttpd/function_test.txt", '0');
				set_tlc($_POST);
			}
			else
				// We are called with a TLC ID
				get_tlc($command[1]);
			break;

		default:
			// We have a sub function
			include("/www/inc/tlc-" . $command[2] . ".php");
			break;
	}

function set_tlc($data)
{
	switch($data['changed'])
	{
		case 0:
			set_stop();
			file_put_contents("/tmp/function_test.txt", 0);
			break;

		case 1:
			if($data['temperature'] == 0)
			{
				set_stop();
				file_put_contents("/tmp/function_test.txt", 0);
			}
			else
			set_temp($data['temperature']);
			break;

		case 2:
			if($data['flow'] == 0)
			{
				set_stop();
				file_put_contents("/tmp/function_test.txt", 0);
			}
			else
			set_flow($data['flow']);
			break;

		case 3:
			set_device_name($data['name']);
			break;

		default:
			set_stop();
			file_put_contents("/tmp/function_test.txt", 0);
			break;

	}
}

function get_all_tlcs()
{
	$base_names = array();

	$base = get_device_name();
	$version = read_version();
	$type = get_type();
	if($type > 4)
		$type -= 4;

	if(file_exists("/tmp/downloaded.txt"))
		$downloaded = trim(file_get_contents("/tmp/downloaded.txt"));
	else
		$downloaded = "0";

	$base_names[] = array(
					'id'	=> 1,
					'type'	=> $type,
					'name'	=> $base,
					'version'	=> $version,
					'version_number_downloaded' => $downloaded,
					);
	header('Content-Type: application/json');
	echo json_encode($base_names);
}

function get_tlc($id)
{
	$localip = get_local_ip();

	$base = get_device_name();
	$state = get_state();
	$temperature = get_temp();
	$serial = read_serial();
	$popup = has_popup();
	$required = get_required();
	$mac = read_mac();
	$model = get_model();
	$sensor = has_sensor();
	
	if(file_exists("/tmp/downloaded.txt"))
		$downloaded = trim(file_get_contents("/tmp/downloaded.txt"));
	else
		$downloaded = "0";

	$interface = get_active_int();
	switch($interface)
	{
		case "eth1":
			$network = "ethernet";
			$currentwlan['name'] = '';
			break;
		case "wlan0":
			$network = "wlan_cl";
			$ssid = trim(shell_exec("/sbin/uci get wireless.@wifi-iface[0].ssid"));
			$currentwlan['name'] = $ssid;
			break;
		default:
			$network = "wlan_ap";
			$ssid = trim(shell_exec("/sbin/uci get wireless.@wifi-iface[1].ssid"));
			$currentwlan['name'] = $ssid;
			break;
	}

	if(is_tlc())
	{
		$flow = get_flow();
		$tlctemp = false;
	}
	else
	{
		$flow = 0;
		$tlctemp = true;
	}

	$version = read_version();
	$type = get_type();
	if($type > 4)
		$type -= 4;

	$tlc = array(
		'id'	=>  $id,
		'name'	=>  $base,
		'type'	=> $type,
		'version'	=> $version,
		'version_number_downloaded' => $downloaded,
		'model'	=> $model,
		'temperature'	=> $temperature,
		'serial'	=> $serial,
		'mac_address'	=> $mac,
		'network'	=> $network,
		'wlan'	=> $currentwlan,
		'state'	=> $state['state'],
		'popup'	=> $popup,
		'temperatur_sensor'	=> $sensor,
		'flow'	=> $flow,
		'required_temp'	=>	$required['temp'],
		'required_flow'	=>	$required['flow'],
		'is_tlc_temperature'	=> $tlctemp,
		'ip'	=>	$localip
	);
        
        if (is_bath()) {
            $tlc['max_amount'] = get_max_amount();
        }

	header('Content-Type: application/json');
	echo json_encode($tlc);
}
?>
