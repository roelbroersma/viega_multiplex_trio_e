<?php
	$uptime = getUptime();

	post_log('uptime', $uptime);

	if($uptime > 5)
	{
		// Read IoT serial number
		$info = json_decode(file_get_contents("/www/inc/info.txt"));
		if($info->serial_number_iot == 'none')
			$serial = $info->serial_number;
		else
			$serial = $info->serial_number_iot;

		// Read all http accounts
		$users = file("/etc/lighttpd/lighttpd.user");
		$newusers = array();
		$found = 0;
		
		echo "Looking for account " . $serial . " to be removed from http auth...\n";
		
		foreach($users as $user)
		{
			// Walk through each user line, there should be maximum 2
			$tmp = explode(":", $user);
			print_r($tmp);
			if($tmp[0] == $serial)
			{
				echo "We found the IoT user account, so remove it now...\n";
				$found = 1;
				post_log('http', 'Removing IoT user account');
			}
			else
				$newusers[] = $user;
		}
		if($found)
		{
			print_r($newusers);
			echo "Writing new http.users file...\n";
			file_put_contents("/etc/lighttpd/lighttpd.user", "");
			foreach($newusers as $newuser)
			{
				file_put_contents("/etc/lighttpd/lighttpd.user", $newuser, FILE_APPEND);
			}
		}
	}
?>
