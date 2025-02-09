<?php

	switch($size)
	{
		case 3:
			if($_POST)
				do_hygiene($command[1]);
			else
				get_hygiene_state($command[1]);
			break;

		case 5:
//			if($_POST)
				do_desinfect($command[4], $command[1]);
			break;
	}

function do_desinfect($command, $id)
{
	$out = print_r($_POST, true);
	file_put_contents("/tmp/log/lighttpd/desinfect-post-" . $id . ".txt", $out);

	switch($command)
	{
		case "start":
			set_desinfect();
			break;

		default:
			set_stop();
			break;
	}
}

function do_hygiene($id)
{
	$out = print_r($_POST, true);
	file_put_contents("/tmp/log/lighttpd/hygiene-post-" . $id . ".txt", $out);

	$int = intval($_POST['repetition_period'] * 24 * 3600 / 25.6);
	$time = $_POST['flush_duration'] * 10;
	$hygiene = $_POST['hygiene_flush_active'];
	if($hygiene == 'false')
		$int = 0;
	else
	{
		$int_h = intval($int / 256);
		$int_l = $int % 256;
	}
	$time_h = intval($time / 256);
	$time_l = $time % 256;
	
	if(is_tlc())
	{
		file_put_contents("/tmp/log/lighttpd/hygiene-post-" . $id . ".txt", "Time: " . $time . "\nInterval: " . $int . "\n", FILE_APPEND);
		set_hygiene($time, $int);
	}
	else
	{
		write_eeprom(206, $int_h);
		write_eeprom(207, $int_l);
		write_eeprom(208, $time_h);
		write_eeprom(209, $time_l);
	}
}

function get_hygiene_state($id)
{
	if(is_tlc())
	{
		$config = file('/etc/TLC-Config.cfg');
		$int = explode(' = ', $config[1]);
		$time = explode(' = ', $config[2]);
		$interval = str_replace(';', '', $int[1]);
		$int = intval(trim($interval)) / 3600 / 24;
		$time = intval(trim(str_replace(';', '', $time[1]))) / 10;
		if($int == 0)
			$hygiene = false;
		else
			$hygiene = true;
	}
	else
	{
		$int_h = read_eeprom(206);
		$int_l = read_eeprom(207);
		$time_h = read_eeprom(208);
		$time_l = read_eeprom(209);
		
		$time = ((256 * $time_h) + $time_l) / 10;
		$int = ((($int_h * 256) + $int_l) * 25.6) / 3600 / 24;
		if($int)
			$hygiene = true;
		else
			$hygiene = false;
	}

	$array = array();
	$array['id'] = $id;
	$array['repetition_period'] = $int;
	$array['hygiene_flush_active'] = $hygiene;
	$array['flush_duration'] = $time;
	header('Content-Type: application/json');
	echo(json_encode($array));
}
?>
