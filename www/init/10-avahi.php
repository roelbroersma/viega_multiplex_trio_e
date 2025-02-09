<?php
	$avahi = file_get_contents("/www/config/http.service");
	$version = trim(file_get_contents("/www/inc/version.txt"));
	$avahi = str_replace("%h", $branding['ssid'] . $serialiot, $avahi);
	$avahi = str_replace("%m", $branding['model'], $avahi);
	$avahi = str_replace("%s", $branding['vendor'], $avahi);
	$avahi = str_replace("%v", $version, $avahi);
	file_put_contents("/etc/avahi/services/http.service", $avahi);
	$avahi = file_get_contents("/www/config/https.service");
	$avahi = str_replace("%h", $branding['ssid'] . $serialiot, $avahi);
	$avahi = str_replace("%m", $branding['model'], $avahi);
	$avahi = str_replace("%s", $branding['vendor'], $avahi);
	$avahi = str_replace("%v", $version, $avahi);
	file_put_contents("/etc/avahi/services/https.service", $avahi);
?>
