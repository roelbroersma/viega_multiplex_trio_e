<?php
	$interval = 20;

	exec('/bin/ps', $result);
	$processes = 0;
	foreach($result as $process)
	{
		if(preg_match("/php-cgi.*watchdog.php/", $process))
		{
			echo "Found process: " . $process . "\n";
			$processes++;
			echo "Number of process: " . $processes . "\n";
		}
	}
	if($processes > 1)
		exit;

	if(file_exists("/tmp/ping.txt"))
	{
		$number = file_get_contents("/tmp/ping.txt");
		$last = $number;

		while(1)
		{
			sleep($interval);
			$number = file_get_contents("/tmp/ping.txt");
			if($number != $last)
			{
				echo "WS client still working: " . $number . "\n";
				$last = $number;
				$proc = array();
				exec("/bin/ps", $proc);
				foreach($proc as $process)
				{
					if(preg_match("/wsclient\.php/", $process))
					{
						$num = preg_split("/\s+/", trim($process));
						echo "Process: " . $num[0] . "\n";
					}
				}
				continue;
			}
			else
			{
				echo "WS client killed or not receiving...\n";
				$proc = array();
				exec("/bin/ps", $proc);
				foreach($proc as $process)
				{
					if(preg_match("/wsclient\.php/", $process))
					{
						echo "Found unresponsive client process: " . $process . "\n";
						echo "Last number: " . $last . ", new number: " . $number . "\n";
						$num = preg_split("/\s+/", trim($process));
						echo "Killing process number: " . $num[0] . "\n";
						exec("/bin/kill " . $num[0]);
					}
				}
				echo "Starting new wsclient process...\n";
				exec("/usr/bin/php-cgi /www/ws/wsclient.php &> /dev/null &");
				echo "Started new wsclient process...\n";
//				exit;
			}
		}
	}
	else
	{
		echo "Starting new wsclient process...\n";
		exec("/usr/bin/php-cgi /www/ws/wsclient.php &> /dev/null &");
		echo "Started new wsclient process...\n";
	}

?>
