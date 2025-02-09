<?php
	include("/www/inc/functions.php");
	include("/www/config/branding.php");

	$uptime = getUptime();

	$info = json_decode(file_get_contents("/www/inc/info.txt"));
	if($info->serial_number_iot == 'none')
		$info->serial_number_iot = $info->serial_number;

	$sleep = $info->serial_number_iot % 30;
	if (count($argv) === 1)
	{
		// skips the delay if a command line arg (i.e. --nodelay) is given
		echo "Sleeping for " . $sleep . " seconds...\n";
		sleep($sleep);
	}

	$server = $branding['socket'];

	$array['server'] = $server;
	$array['password'] = $info->password;
	$array['serial_number'] = $info->serial_number;
	$array['serial_number_iot'] = $info->serial_number_iot;
	$array['type'] = '1';
	$array['hash'] = hash('sha512', $info->password . 'hugogehtgernefischen');
	$array['mac_address'] = read_mac();
	$array['ip_address'] = get_local_ip();
	$array['version_number'] = get_url('https://127.0.0.1/api/version/');
	if(file_exists("/tmp/downloaded.txt"))
	{
		$downloaded = trim(file_get_contents("/tmp/downloaded.txt"));
	}
	else
		$downloaded = 0;
	$array['version_number_downloaded'] = $downloaded;
	$array['name'] = get_url('https://127.0.0.1/api/tlc/1/name/');

	$settings['ip'] = trim(file_get_contents("https://" . $server . "/api/ip/"));
	$settings['uptime'] = $uptime;
	$mem = file("/proc/meminfo");
	preg_match_all('!\d+!', $mem[1], $matches);
	$settings['mem'] = $matches[0][0];
	$settings['disk'] = intval(disk_free_space("/") / 1024);
	$settings['kernel'] = getKernel();
	$array['settings'] = json_encode($settings);

	print_r($array);

	$ch = curl_init();
	$url = "https://" . $server . "/api/add-iot/?sn=" . $info->serial_number_iot;
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_PORT, 443);
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($array));
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 1);
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 1);
//	curl_setopt($ch, CURLOPT_CAINFO, "/etc/certs/ca-bundle.crt");

	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

	$start = microtime(true);
	$server_output = json_decode(curl_exec ($ch));
	$end = microtime(true);
	file_put_contents("/tmp/rtt.txt", round($end - $start, 3));

	curl_close ($ch);

	print_r($server_output);

	echo "Channel: " . $server_output->channel . "\n";

	switch($server_output->status)
	{
		case 200:
		case 418:
			file_put_contents("/tmp/channel.txt", $server_output->channel);
			break;
		default:
			file_put_contents("/tmp/channel.txt", "0");
			break;
	}

?>
