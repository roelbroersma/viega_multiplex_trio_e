<?php

// Definitions for Twinlevel
$brand[0]['ssid'] = "tlc-";
$brand[0]['socket'] = "twinlevel.oblamatik.ch";
// $brand[0]['socket'] = "stage-oblamatik.oblamatik.ch";
$brand[0]['hostname'] = "twinlevel";
$brand[0]['vendor'] = "Oblamatik AG";
$brand[0]['model'] = "Twinlevel";
$brand[0]['brlan'] = "1.1.1.1";
$brand[0]['device_name'] = "TWINLEVEL";

// Definitions for Crosswater
$brand[1]['ssid'] = "crosswater-";
$brand[1]['socket'] = "digital.crosswater.co.uk";
// $brand[1]['socket'] = "stage-crosswater.oblamatik.ch";
$brand[1]['hostname'] = "digital";
$brand[1]['vendor'] = "Crosswater";
$brand[1]['model'] = "Digital";
$brand[1]['brlan'] = "192.168.1.1";
$brand[1]['device_name'] = "Digital";

// Definitions for Trio-E
$brand[2]['ssid'] = "trio-e-";
$brand[2]['socket'] = "trio-e.viega.de";
// $brand[2]['socket'] = "stage-trioe.oblamatik.ch";
$brand[2]['hostname'] = "trio-e";
$brand[2]['vendor'] = "Viega";
$brand[2]['model'] = "Trio-E";
$brand[2]['brlan'] = "1.1.1.1";
$brand[2]['device_name'] = "Trio-E";

if (file_exists("/etc/brand"))
	$vendor = intval(trim(file_get_contents("/etc/brand")));
else
	$vendor = 0;

$branding = $brand[$vendor];
