<?php

$start = time();
$end = $start + 45;

$onDuration = 300000;
$offDuration = 300000;
$pauseDuration = 2000000;

$now = time();
while ($now < $end) {
	if (file_exists("/tmp/networkmode.txt")) {
		$mode = intval(file_get_contents("/tmp/networkmode.txt"));
	} else {
		$mode = 0;
	}
	$duration = round((($onDuration + $offDuration) * $mode + $pauseDuration) / 1000000);
	if ($now + $duration + 1 > $end) {
		break;
	}
	for ($i = 0; $i < $mode; $i++) {
		file_put_contents("/sys/class/leds/carambola2:orange:eth1/brightness", "1");
		usleep($onDuration);
		file_put_contents("/sys/class/leds/carambola2:orange:eth1/brightness", "0");
		usleep($offDuration);
	}
	usleep($pauseDuration);
	$now = time();
}
