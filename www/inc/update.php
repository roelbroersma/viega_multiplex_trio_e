<?php
	$logdir = "/var/log/lighttpd/";

	include("/www/inc/functions.php");
	
	$info = json_decode(file_get_contents("/www/inc/info.txt"));
	$versions = explode('-', $info->version);
	$base_version = $versions[0];
	$iot_version = $versions[1];
	file_put_contents('/tmp/update.txt', '\nIoT version: ' . $iot_version, FILE_APPEND);

	if(isset($argv))
	{
		$path = $argv[1];
		file_put_contents('/tmp/update.txt', '\nStarting update in directory ' . $path, FILE_APPEND);

		// Check now if we have a valid software image for the iot module
		$iot = check_iot($path);
		file_put_contents('/tmp/update.txt', '\n' . print_r($iot, TRUE) . '\n', FILE_APPEND);
		if($iot['status'] != 200)
		{
			file_put_contents('/tmp/update.txt', '\niot module software verification failed\n', FILE_APPEND);
			exec("/bin/rm -rf /tmp/" . $path);
			exit;
		}
		else
		{
			file_put_contents('/tmp/update.txt', '\niot module software verified successfully', FILE_APPEND);
			if($iot['version'] > $iot_version)
			{
				file_put_contents('/tmp/update.txt', '\nTesting IoT module software', FILE_APPEND);
				exec("/sbin/sysupgrade -T /tmp/" . $path . "/iot.bin", $out, $result);
		
				if($result == 0)
				{
					file_put_contents('/tmp/update.txt', '\nstarting iot.bin upgrade', FILE_APPEND);
					exec('/sbin/sysupgrade -q -c /tmp/' . $path . '/iot.bin');
				}
				else
				{
					file_put_contents('/tmp/update.txt', '\nsysugrade test failed: ' . json_encode(print_r($out, true)), FILE_APPEND);
				}
			}
			else
				file_put_contents('/tmp/update.txt', '\nIoT module software will not be updated\n', FILE_APPEND);
		}


		exec("/bin/rm -rf /tmp/" . $path);
		exit;
	}
	else
	{
		file_put_contents('/tmp/update.txt', '\nMissing path parameter to start update\n', FILE_APPEND);
		exit;
	}
?>
