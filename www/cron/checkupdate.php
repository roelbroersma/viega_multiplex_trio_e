<?php
	include("/www/inc/functions.php");
	include("/www/config/branding.php");

	$info = json_decode(file_get_contents("/www/inc/info.txt"));
	$local = $info->version;
	$tmp = explode("-", $local);
	$local_iot = $tmp[1];
	$local_base = $tmp[0];

	// add additional delay to not run together with register
	$sleep = $info->serial_number_iot % 30 + 10;
	if (count($argv) === 1)
	{
		// skips the delay if a command line arg (i.e. --nodelay) is given
		echo "Sleeping for " . $sleep . " seconds...\n";
		sleep($sleep);
	}

	if (file_exists("/tmp/networkmode.txt")) {
		$mode = intval(file_get_contents("/tmp/networkmode.txt"));
		$result = null;
		exec('/bin/date +"%H"', $result);
		if ($result[0] == "00" && ($mode === 1 || $mode === 3)) {
			// update clock daily if connected to ETH or as STA
			echo "Updating clock\n";
			exec("/usr/bin/sudo /etc/init.d/ntpdate start");
		}
	}

	$server = $branding['socket'];
	echo "Checking update on " . $server . PHP_EOL;

	$ch = curl_init();
	$url = "https://" . $server . "/api/versions/1?sn=" . $info->serial_number_iot;
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_PORT, 443);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 1);
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 1);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

	$serverInfo = curl_exec($ch);
	$error = curl_errno($ch);
	if($error)
	{
		echo "Error nbr.: " . $error . "\n";
		echo "Error: " . curl_error($ch) . "\n";
		curl_close($ch);
		exit;
	}
	curl_close($ch);

	$data = json_decode($serverInfo);
	print_r($data->fields);

	$remote_iot = $data->fields->framework_version;
	$remote_base = $data->fields->basestation_version;

	$filesize = $data->fields->file_size;
	if($filesize > 16000000)
	{
		echo "Filesize too large to download...\n";
		exit;
	}

	echo "Local version:  " . $local_base . "-" . $local_iot . "\n";
	echo "Remote version: " . $remote_base . "-" . $remote_iot . "\n";

	$downloaded = "0-0";

	$message = array();
	$message['local'] = $local_base . "-" . $local_iot;
	$message['remote'] = $remote_base . "-" . $remote_iot;

	// post_log(50, 'checkupdate: ' . print_r($message, true));

	if(($remote_base > $local_base) || ($remote_iot > $local_iot))
	{
		if(file_exists("/tmp/firmware.bin"))
		{
			$md5 = md5_file("/tmp/firmware.bin");
			if($md5 == $data->fields->checksum)
			{
				echo "Already latest version downloaded...\n";
				exit;
			}
		}

		echo "Downloading new firmware version...\n";
		$fp = fopen ('/tmp/firmware.bin', 'w+');
		$url = "https://" . $server . $data->fields->download_url . "?sn=" . $info->serial_number_iot;
		$ch = curl_init(str_replace(" ","%20",$url));
		curl_setopt($ch, CURLOPT_TIMEOUT, 50);
		curl_setopt($ch, CURLOPT_FILE, $fp);
		curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
		curl_exec($ch);
		curl_close($ch);
		fclose($fp);
//		exec("/usr/bin/wget -O /tmp/firmware.bin " . $url, $out, $result);

		if(file_exists("/tmp/firmware.bin"))
		{
			$md5 = md5_file("/tmp/firmware.bin");
			if($md5 == $data->fields->checksum)
			{
				echo "Checksum verify okay...\n";
				$downloaded = $data->fields->basestation_version . "-" . $data->fields->framework_version;
				post_log(51, 'Download MD5 okay');
			}
			else
			{
				exec("/bin/rm /tmp/firmware.bin");
			}
		}
	}

	file_put_contents("/tmp/downloaded.txt", $downloaded);
