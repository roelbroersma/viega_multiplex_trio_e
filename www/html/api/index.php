<?php
	include("/www/inc/functions.php");
	include("/www/config/branding.php");
	$command = explode('/', $_GET['url']);
	
	$out = print_r($command, true);
	file_put_contents("/tmp/get.txt", $out);

	if($command[0])
	{
		$size = sizeof($command);
		include("/www/inc/" . $command[0] . ".php");
	}
	else
	{
		// Just /api/ is called
		$array['model'] = $branding['model'];
		$array['type'] = 1;
		$array['name'] = get_device_name();
		$array['serial'] = read_serial();
		$array['version'] = read_version();
		$array['vendor'] = $branding['vendor'];
		if(file_exists("/tmp/downloaded.txt"))
		{
			$downloaded = trim(file_get_contents("/tmp/downloaded.txt"));
			if(strlen($downloaded) < 8)
				$downloaded = "0";
		}
		else
			$downloaded = "0";
		$array['downloaded'] = $downloaded;
		$array['uptime'] = getUptime();
		$array['disk'] = intval(disk_free_space("/") / 1024);
		$mem = file("/proc/meminfo");
		preg_match_all('!\d+!', $mem[1], $matches);
		$array['mem'] = $matches[0][0];
		if(file_exists("/tmp/channel.txt"))
			$channel = trim(file_get_contents("/tmp/channel.txt"));
		else
			$channel = "0";
		$array['channel'] = $channel;
		$if = (array) json_decode(shell_exec("/usr/bin/sudo /sbin/ifstatus wwan"), true);
		if(is_array($if))
			$array['ifuptime'] = intval($if['uptime'] / 60);
		else
			$array['ifuptime'] = 0;

		header('Content-Type: application/json');
		echo json_encode($array);
	}
?>
