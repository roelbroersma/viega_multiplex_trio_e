<?php

$doScan = $size == 2;

$info = json_decode(file_get_contents('/www/inc/info.txt'));

$wifiEnabled = isWifiEnabled();
$apEnabled = isApEnabled();
$staEnabled = isStaEnabled();
$controllerInfo = getControllerInfo();
$radioInfo = getRadioInfo();
if ($doScan) {
	$wlans = scan_wlans();
}
$versionInfo = read_version();
$versionController = explode("-", $versionInfo)[0];

$data = [
	'IOT' => '',
	'vendor' => $branding['vendor'],
	'model' => $branding['model'],
	'kernel' => getKernel(),
	'serial_number_iot' => $info->serial_number_iot,
	'version_iot' => trim(file_get_contents("/www/inc/version.txt")),
	'name_iot' => htmlspecialchars(get_device_name()),
	'mem_usage' => getMemUsage(),
	'tmp_usage' => getDiskUsage("/tmp"),
	'disk_usage' => getDiskUsage(),
	'datetime' => date('Y-m-d H:i:s'),
	'uptime' => getUptime(1) . "s",
	PHP_EOL . 'CONTROLLER' => '',
	'serial_number_controller' => $info->serial_number,
	'version_controller' => $versionController,
	'controller' => $controllerInfo['tlc_temp'] ? 'tlc temp' : 'tlc',
	'flow' => $controllerInfo['flow'] == 1 ? 'yes' : 'no',
	'type' => labelType(),
	'name_controller' => get_device_name(),
	PHP_EOL . 'CLOUD' => '',
	'server' => $branding['socket'],
	'channel' => file_get_contents('/tmp/channel.txt'),
	'rtt' => @ file_get_contents('/tmp/rtt.txt') . "s",
	PHP_EOL . 'NETWORK' => '',
	'network_mode' => labelMode(get_network_mode()),
	'network_mac' => read_mac_from_interface('eth1'),
	'network_ip' => getIpAddress('wan'),
	PHP_EOL . 'WIRELESS' => '',
	'wifi_enabled' => $wifiEnabled ? 'yes' : 'no',
	'ap_enabled' => $apEnabled ? 'yes' : 'no',
	'ap_mac' => read_mac_from_interface('eth0'),
	'ap_ip' => getIpAddress('lan'),
	'sta_enabled' => $staEnabled ? 'yes' : 'no',
	'sta_mac' => read_mac_from_interface('wlan0'),
	'sta_ip' => getIpAddress('wwan'),
	'sta_ssid' => $radioInfo['ssid'],
	'sta_quality' => $radioInfo['quality'],
];

?>
<html>
<head>
    <title>dev</title>
    <!--meta http-equiv="refresh" content="3"-->
</head>
<body>
<pre>
<?php

foreach ($data as $key => $value) {
	echo $key . ": " . $value . PHP_EOL;
}

if ($doScan) {
	echo PHP_EOL;

	echo "WLANS:" . PHP_EOL;
	foreach ($wlans as $key => $value) {
		echo $value['rawsignal'] . " " . $value['name'] . PHP_EOL;
	}
}

?>
</pre>
</body>
</html>