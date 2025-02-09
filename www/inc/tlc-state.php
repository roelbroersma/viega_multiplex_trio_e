<?php

	switch($size)
	{
		case 3:
			get_tlc_state($command[1]);
			break;

	}


function get_tlc_state($id)
{
	$state = get_state();

	switch($state['state'])
	{
		case 'a':
        case 'b':
	case 'f':
			set_watchdog(5);
			break;

		default:
			set_watchdog(0);
			break;
	}
	
	$array = array();
	
	$array['id'] = $id;
	$array['state'] = $state['state'];
	$array['progress'] = $state['progress'];
	$array['set_temperature'] = $state['set'];
	
	if(file_exists("/tmp/function_test.txt"))
		$array['function_test'] = intval(file_get_contents("/tmp/function_test.txt"));
	else
		$array['function_test'] = 0;

	header('Content-Type: application/json');
	echo(json_encode($array));

	file_put_contents("/tmp/log/lighttpd/get-state.txt", json_encode($array) . "\n", FILE_APPEND);
}
?>
