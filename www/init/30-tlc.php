<?php

exec('/bin/rm /tmp/TLC-Info.cfg');
exec('/usr/bin/killall tlc-iot');
exec('/usr/bin/killall ser2net');
sleep(2);

//	Try several times to read the serial number during startup from a TLC-Temp
file_put_contents("/etc/ser2net.conf", "127.0.0.1,2001:raw:1:/dev/ttyATH0:9600 NONE 1STOPBIT 8DATABITS LOCAL -RTSCTS\n");
exec("/usr/sbin/ser2net -c /etc/ser2net.conf");

file_put_contents('/tmp/serial.txt', "Serial Read from TLC-Temp:\n");
for ($i = 0; $i < 5; $i++) {
	$serial = read_serial();
	file_put_contents('/tmp/serial.txt', "Try " . ($i + 1) . " of 5, Serial: " . $serial . "\n", FILE_APPEND);
	if ((strlen($serial) > 0) && ($serial != 0))
		break;
	sleep(2);
	$serial = 'none';
}
if (strlen($serial) < 2)
	$serial = 'none';

if (($serial == '0') || ($serial == 'none')) {
	exec('/usr/bin/killall ser2net');
	sleep(2);

	file_put_contents("/tmp/startup.txt", "Starting tlc-iot...\n");
	exec('/usr/bin/tlc-iot -p /dev/ttyATH0 > /var/log/tlc-iot.log &');
	file_put_contents("/tmp/startup.txt", "tlc-iot started...\n", FILE_APPEND);
	$tlc = 0;
	for ($i = 0; $i < 40; $i++) {
		// Check for 40 seconds if the /tmp/TLC-Info.cfg file is created
		file_put_contents("/tmp/startup.txt", "Looking for TLC-Info.cfg, try: " . ($i + 1) . "\n", FILE_APPEND);
		if (file_exists('/tmp/TLC-Info.cfg')) {
			sleep(5);
			file_put_contents("/tmp/startup.txt", "Found...\n", FILE_APPEND);
			$tlc = 1;
			$tlc_config = file('/tmp/TLC-Info.cfg');
			foreach ($tlc_config as $tlc_line) {
				if (preg_match("/serial_num/", $tlc_line)) {
					$tmp = explode(" = ", $tlc_line);
					$serial = str_replace(';', '', $tmp[1]);
					$serial = str_replace('"', '', $serial);
				}
				if (preg_match("/pty/", $tlc_line)) {
					$tmp = explode(" = ", $tlc_line);
					$port = str_replace(';', '', $tmp[1]);
					$port = str_replace('"', '', $port);
				}
			}
			file_put_contents("/etc/ser2net.conf", "127.0.0.1,2001:raw:1:" . trim($port) . ":9600 NONE 1STOPBIT 8DATABITS LOCAL -RTSCTS\n");
			exec("/usr/sbin/ser2net -c /etc/ser2net.conf");
			print_r($ser);
			print_r($pty);
			break;
		}
		sleep(1);
	}
}

// initialize device name
if (!file_exists("/oblamatik/device_name.txt")) {
	$oldName = get_name();
	if ($oldName === "TWINLEVEL") {
		// use default name from branding
		$oldName = $branding['device_name'];
	}
	file_put_contents('/oblamatik/device_name.txt', $oldName);
	exec("/bin/chmod 666 /oblamatik/device_name.txt");
}
