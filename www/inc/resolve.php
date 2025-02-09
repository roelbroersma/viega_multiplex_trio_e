<?php

	sleep(10);
	for($i = 0; $i < 5; $i++)
	{
		// Lookup up to 6 tlc devices
		if($i)
		{
			// We are looking for tlc-2.local - tlc-5.local
			$host = "tlc-" . ($i + 1);
			echo "Looking for: " . $host . "\n";
			exec('/usr/bin/avahi-resolve -4 -n ' . $host  . '.local', $out);
		}
		else
			// We ar elooking for tlc.local
			exec('/usr/bin/avahi-resolve -4 -n tlc.local', $out);

		if(is_array($out))
		{
			if(sizeof($out))
			{
				// We received a hostname and IP address
				$parts = preg_split('/\s+/', $out[0]);
				echo "Found: " . $out[0] . "\n";
				print_r($out);
				if($i)
					// We have more than one tlc device
					file_put_contents('/tmp/mdns.txt', $parts[1] . "\n", FILE_APPEND);
				else
					file_put_contents('/tmp/mdns.txt', $parts[1] . "\n");
			}
		}
		$out = '';
	}

?>

