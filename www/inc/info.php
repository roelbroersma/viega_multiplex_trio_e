<?php
	$info = array();
	$info['version'] = read_version();
	$info['serial'] = read_serial();
	$info['name'] = get_device_name();

	header('Content-Type: application/json');
	echo json_encode($info);
?>
