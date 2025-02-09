<?php

include("/www/inc/functions.php");
include("/www/config/branding.php");

exec('/usr/sbin/fw_printenv serialnum', $iot);
$serialiot = explode("=", $iot[0]);
$serialiot = trim($serialiot[1]);
if (!$serialiot)
	$serialiot = 'none';

exec('/usr/sbin/fw_printenv passwd', $result);
$key = explode('=', $result[0]);

if (strlen($key[1]) > 7)
	$password = $key[1];
else
	$password = "12341234";

if (!file_exists("/oblamatik/")) {
	mkdir("/oblamatik");
	exec("/bin/chmod 777 /oblamatik");
}

$files = array_diff(scandir("/www/init"), array('.', '..', 'init.php', 'wlan.php', 'hostname.php'));

foreach ($files as $file) {
	echo "Loading file: " . $file . "\n";
	include("/www/init/" . $file);
}
