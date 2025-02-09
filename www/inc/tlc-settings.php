<?php

	switch($size)
	{
		case 3:
			if($_POST)
				do_settings($command[1]);
			else
				get_settings($command[1]);
			break;
	}


function do_settings($id)
{
	$out = print_r($_POST, true);
	file_put_contents("/tmp/log/lighttpd/settings-post-" . $id . ".txt", $out);

	$data = $_POST;

	if(is_tlc())
	{
		set_temp_unit($data['temperature_unit']);
	}
	else
	{
		write_eeprom(212, $data['temperature_unit']);
		$max_temp = $data['max_temp'] * 10;
		$max_temp_h = intval($max_temp / 256);
		$max_temp_l = $max_temp % 256;
		write_eeprom(210, $max_temp_h);
		write_eeprom(211, $max_temp_l);
	
		$max_flow = $data['max_flow_time'] * 600;
		$max_flow_h = intval($max_flow / 256);
		$max_flow_l = $max_flow % 256;
		write_eeprom(204, $max_flow_h);
		write_eeprom(205, $max_flow_l);
	
		$color = $data['ambient_light'];
		switch($data['ambient_light'])
		{
			case 0:
				$color = 52;
				break;
			case 1:
				$color = 49;
				break;
			case 2:
				$color = 0;
				break;
			case 3:
				$color = 48;
				break;
			case 4:
				$color = 47;
				break;
			case 5:
				$color = 24;
				break;
			case 6:
				$color = 17;
				break;
			case 7:
				$color = 50;
				break;
			case 8:
				$color = 51;
				break;
			case 9:
				$color = 53;
				break;
		}
		write_eeprom(213, $color);
	}
        
        if (is_bath() && array_key_exists('max_amount', $data)) {
            $max_amount = intval($data['max_amount']);
            if (100 <= $max_amount && $max_amount <= 10000) {
                set_max_amount($max_amount);
            }
        }
}

function get_settings($id)
{
	$array['id'] = $id;

	if(is_tlc())
	{
		$array['temperature_unit'] = get_temp_unit();
	}
	else
	{
		$array['temperature_unit'] = intval(read_eeprom(212));
		
		$scald_temp_h = read_eeprom(2);
		$scald_temp_l = read_eeprom(3);
		$scald_temp = ($scald_temp_h * 256 + $scald_temp_l) / 10;
		$array['scald_temp'] = $scald_temp;
	
		$max_temp_h = read_eeprom(210);
		$max_temp_l = read_eeprom(211);
		$max_temp = ($max_temp_h * 256 + $max_temp_l) / 10;
		$array['max_temp'] = $max_temp;
	
		$max_flow_h = read_eeprom(204);
		$max_flow_l = read_eeprom(205);
		$max_flow = ($max_flow_h * 256 + $max_flow_l) / 600;
		$array['max_flow_time'] = $max_flow;
	
		$ambient = read_eeprom(213);
		switch($ambient)
		{
			case 0:
				$color = 2;
				break;
			case 52:
				$color = 0;
				break;
			case 49:
				$color = 1;
				break;
			case 48:
				$color = 3;
				break;
			case 47:
				$color = 4;
				break;
			case 24:
				$color = 5;
				break;
			case 17:
				$color = 6;
				break;
			case 50:
				$color = 7;
				break;
			case 51:
				$color = 8;
				break;
			case 51:
				$color = 9;
				break;
		}
		$array['ambient_light'] = $color;
	}
	$array['passwordSet'] = false;
        
        if (is_bath()) {
            $array['max_amount'] = get_max_amount();
        }
	header('Content-Type: application/json');
	echo(json_encode($array));
}
?>
