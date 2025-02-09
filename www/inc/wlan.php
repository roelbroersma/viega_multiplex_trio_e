<?php

switch ($size) {
	case 1:
		header('Content-Type: application/json');
		echo_wlans();
		break;

	case 2:
	case 3:
		include("/www/inc/wlan-" . $command[1] . ".php");
		break;

	default:
		header('Content-Type: application/json');
		echo_wlans();
		break;
}

function echo_wlans()
{
	echo json_encode((object)scan_wlans());
}