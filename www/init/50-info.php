<?php
	$array = array();
//	sleep(10);
	$array['version'] = read_version();
	$array['serial_number'] = read_serial();
	for($i = 0; $i < 5; $i++)
	{
		$array['version'] = read_version();
		$array['serial_number'] = read_serial();
		if(intval($array['version']) >= 1)
		{
			file_put_contents("/tmp/tries.txt", "Tries: " . $i);
			break;
		}
		sleep(2);
	}
	$array['serial_number_iot'] = $serialiot;
	$array['password'] = hash('sha512', $password);
	$array['name'] = get_device_name();
	$array['ip'] = get_local_ip();
	
	print_r($array);
	
	$info = json_encode($array);
	file_put_contents("/www/inc/info.txt", $info);

	// Build http.auth entry for IoT user
	$realm = $serialiot . ':' . $branding['vendor'] . ':' . md5($serialiot . ':' . $branding['vendor'] . ':' . $password) . "\n";
	// read in existing user file
	$users = file("/etc/lighttpd/lighttpd.user");
	$newusers = "";
	foreach($users as $user)
	{
		if(strlen($user) > 1)
		{
			// We found a user line
			$temp = explode(":", $user);
			if($tmp[0] != $serialiot)
				$newusers .= $user;
		}
	}
	$newusers .= $realm;
	file_put_contents("/etc/lighttpd/lighttpd.user", $newusers);

	exec("/bin/chown http /etc/lighttpd/lighttpd.user");
	exec("/bin/chgrp www-data /etc/lighttpd/lighttpd.user");
	exec("/etc/init.d/sshd stop");

?>
