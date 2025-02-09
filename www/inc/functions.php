<?php
function is_tlc()
{
	if(file_exists('/tmp/TLC-Info.cfg'))
		return(1);
	else
		return(0);
}

function post_log($event, $info)
{
	$db = new SQLite3("/oblamatik/events.db");
	$db->exec("insert into event (event, time, info) values ($event, datetime('now'), '$info')");
	$db->close();
}

function get_active_int()
{
	$wan = (array) json_decode(shell_exec("/usr/bin/sudo /sbin/ifstatus wan"));
	$wwan = (array) json_decode(shell_exec("/usr/bin/sudo /sbin/ifstatus wwan"));
	if($wan['up'])
		return("eth1");
	if($wwan['up'])
		return("wlan0");
	return("br-lan");
}

function get_network_mode($filename = "/tmp/networkmode.txt")
{
	if (file_exists($filename)) {
		return intval(trim(file_get_contents($filename)));
	} else {
		return 0;
	}
}

function labelMode($mode) {
	switch ($mode) {
		case 1:
			return $mode . ' - Ethernet';
		case 2:
			return $mode . ' - AP';
		case 3:
			return $mode . ' - STA';
		case 4:
			return $mode . ' - STA, SSID not visible';
		case 5:
			return $mode . ' - STA, router unreachable';
		case 6:
			return $mode . ' - AP fallback';
		default:
			return $mode . ' - unknown';
	}
}

function get_local_ip()
{
	$wan = (array) json_decode(shell_exec("/usr/bin/sudo /sbin/ifstatus wan"));
	$wwan = (array) json_decode(shell_exec("/usr/bin/sudo /sbin/ifstatus wwan"));
	if($wan['up'])
		return($wan['ipv4-address'][0]->address);
	if($wwan['up'])
		return($wwan['ipv4-address'][0]->address);
	return(trim(shell_exec("/sbin/uci get network.lan.ipaddr")));
}

function open_valve($valve)
{
	if(is_tlc())
		return;

	set_valve($valve);
}

/**
 * Replaces ' by '\'' to quote values with single quotes.
 * @param type $value
 * @return type
 */
function escape_uci($value) {
    return str_replace("'", "'\\''", $value );
}

/**
 * Escapes special characters in the grep pattern.
 * @param type $value
 * @return type
 */
function escape_grep($value) {
    $value = str_replace("\\", "\\\\", $value);
    $value = str_replace("@", "\@", $value);
    $value = str_replace("`", "\`", $value);
    $value = str_replace("[", "\[", $value);
    $value = str_replace("{", "\{", $value);
    $value = str_replace("\"", "\\\"", $value);
    return $value;
}

function interface_active($interface)
{
	$wan = json_decode(shell_exec("/sbin/ifstatus " . $interface), true);
	if($wan)
	{
		if($wan['up'])
		{
			if(isset($wan['ipv4-address'][0]['address']))
			{
				if(do_ping($wan['route'][0]['target']))
					return(0);
				else
					return(1);
			}
		}
	}
	return(0);
}

function network_mode()
{
	// Return current network mode
	// 1 = Ethernet mode
	// 2 = AP mode without valid STA configuration
	// 3 = STA mode
	// 4 = STA mode, but SSID not visible
	// 5 = STA mode, SSID visible, but router not reachable
	// 6 = AP mode, previous STA SSID not visible

	// Check if we are connected via ethernet
	if(interface_active('wan'))
		return(1);

	// Check if we have a STA SSID set
	if(trim(shell_exec("/sbin/uci get wireless.@wifi-iface[0].ssid")) == "SSID")
	{
		// We don't have any valid STA SSID configuration
		return(2);
	}
	else
	{
		if(interface_active('wwan'))
			return(3);
		else
		{
			// We have a STA configuration, but gateway is not reachable or not visible
			$ssid = trim(shell_exec("/sbin/uci get wireless.@wifi-iface[0].ssid"));
			if(wlan_search($ssid))
			{
				if(trim(shell_exec("/sbin/uci get wireless.@wifi-iface[1].disabled")) == "1")
					// STA SSID is visible, but gateway not reachable
					return(5);
				else
					return(6);
			}
			else
			{
				if(trim(shell_exec("/sbin/uci get wireless.@wifi-iface[1].disabled")) == "1")
				{
					// AP mode is disabled
					return(4);
				}
				else
					// AP mode is enabled
					return(6);
			}
		}
	}
}

function get_sta_ssid()
{
	return(trim(shell_exec("/sbin/uci get wireless.@wifi-iface[0].ssid")));
}

function wlan_search($ssid)
{
	exec("/usr/bin/sudo /usr/sbin/iwlist wlan0 scan | grep ESSID", $scan, $return);
	if($return)
		return(0);
	foreach($scan as $network)
		if(strpos($network, 'ESSID:"' . $ssid . '"') !== false)
			return(1);
	return(0);
}

function wlan_sta($mode)
{
	$previous = intval(trim(shell_exec("/sbin/uci get wireless.@wifi-iface[0].disabled")));
	if($previous == $mode)
	{
		if($mode)
		{
			exec("/sbin/uci set wireless.@wifi-iface[0].disabled=0");
			// when WLAN AP unused, set to 1.1.1.1 always
			exec("/usr/bin/sudo /sbin/uci set network.lan.ipaddr='1.1.1.1'");
		}
		else
			exec("/sbin/uci set wireless.@wifi-iface[0].disabled=1");
		exec("/sbin/uci commit");
		exec("/sbin/wifi reload");
	}
}

function wlan_ap($mode, $ipaddr = '1.1.1.1')
{
	$previous = intval(trim(shell_exec("/sbin/uci get wireless.@wifi-iface[1].disabled")));
	if($previous == $mode)
	{
		if($mode)
		{
			exec("/sbin/uci set wireless.@wifi-iface[1].disabled=0");
			exec("/usr/bin/sudo /sbin/uci set network.lan.ipaddr='" . $ipaddr . "'");
		}
		else
			exec("/sbin/uci set wireless.@wifi-iface[1].disabled=1");
		exec("/sbin/uci commit");
		exec("/sbin/wifi reload");
	}
}

function wlan_state($mode)
{
	switch($mode)
	{
		case 'ap':
			$state = intval(trim(shell_exec("/sbin/uci get wireless.@wifi-iface[1].disabled")));
			break;
		default:
			$state = intval(trim(shell_exec("/sbin/uci get wireless.@wifi-iface[0].disabled")));
			break;
	}
	return($state);
}

function do_ping($address)
{
	exec("/bin/ping -c 1 -W 1 " . $address, $out, $return);
	return($return);
}

function get_type()
{
	if(file_exists('/tmp/TLC-Info.cfg'))
	{
		$info = file("/tmp/TLC-Info.cfg");
		foreach($info as $line)
		{
			if(preg_match("/type/", $line))
			{
				$tmp = explode(" = ", $line);
				$type = str_replace(';', '', $tmp[1]);
				return(trim($type));
			}
		}
	}
	else
	{
		$type = read_eeprom(1) & 7;
	}
	return($type);
}

function get_model()
{
        if(file_exists('/tmp/TLC-Info.cfg'))      
        {                                         
                $info = file("/tmp/TLC-Info.cfg");
                foreach($info as $line)                
                {                                      
                        if(preg_match("/type_string/", $line))      
                        {                                             
                                $tmp = explode(" = ", $line);         
                                $model = str_replace(';', '', $tmp[1]);
				$model = str_replace('"', '', $model);
                                return(trim($model));                  
                        }                                             
                }                                                     
        }                                                             
        else                                                          
        {                                                             
                $model = "TLC";
        }                                                             
        return($model);                                                
}

function get_required()
{
	$required['temp'] = 0;
	$required['flow'] = 0;

	if(file_exists('/tmp/TLC-Info.cfg'))
	{
		$info = file("/tmp/TLC-Info.cfg");
		foreach($info as $line)
		{
			if(preg_match("/required_temp/", $line))
			{
				$tmp = explode(" = ", $line);
				$required['temp'] = trim(str_replace(';', '', $tmp[1])) / 10;
			}
			if(preg_match("/required_flow/", $line))
			{
				$tmp = explode(" = ", $line);
				$required['flow'] = trim(str_replace(';', '', $tmp[1])) / 100;
			}
		}
	}
	return($required);
}

function read_mac_from_interface($interface)
{
	exec("/sbin/ifconfig " . $interface, $output);

	if (count($output) > 0) {
		$mac = preg_replace("/^" . $interface . ".*HWaddr/", "", $output[0]);
		return trim(str_replace(":", "-", $mac));
	} else {
		return "";
	}
}

function read_mac()
{
	$network_mode = get_network_mode();
	switch ($network_mode) {
		case 1:
			// wan/eth1
			return read_mac_from_interface("eth1");
		case 2:
		case 6:
			// lan/eth0
			return read_mac_from_interface("eth0");
		case 3:
		case 4:
		case 5:
			// wwan/wlan0
			return read_mac_from_interface("wlan0");
		default:
			return "";
	}
}

function has_popup()
{
	if(file_exists('/tmp/TLC-Info.cfg'))
	{
		$info = file("/tmp/TLC-Info.cfg");
		foreach($info as $line)
		{
			if(preg_match("/popup/", $line))
			{
				if(preg_match("/true/", $line))
					return true;
				else
					return false;
			}
		}
	}
	else
	{
		$popup = read_eeprom(0);
		if($popup & 16)
			return true;
		else
			return false;
	}
}

function has_sensor()
{
        if(file_exists('/tmp/TLC-Info.cfg'))                    
        {                                                       
                $info = file("/tmp/TLC-Info.cfg");              
                foreach($info as $line)                         
                {                                               
                        if(preg_match("/temp_sensor/", $line))        
                        {                                       
                                if(preg_match("/true/", $line))
                                        return true;           
                                else                           
                                        return false;          
                        }                                      
                }                                              
        }                                                      
	return(false);
}

function read_version()
{
	$command = "Zb";
	$out = read_command($command, 2);

	$d1 = ord($out[0]) - 48;
	$d2 = ord($out[1]) - 48;

	$tmp = number_format((($d1 * 16) + $d2) / 10, 1);
	$iot = trim(file_get_contents('/www/inc/version.txt'));
	$version = $tmp . '-' . $iot;
	return $version;
}

function get_url($url)
{
	$ch = curl_init(); 
	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_PORT, 443);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); 
	$output = curl_exec($ch); 
	curl_close($ch);
	return(trim($output));
}

function get_name()
{
	$command = "r";
	$out = read_command($command, 1);
	
	return (html_entity_decode($out));
}

function set_name($name)
{
	$name = htmlentities($name);
	$command = 'q"' . $name . '",';
	$out = write_command($command, 1);

	return $out;
}

function get_device_name()
{
	if (file_exists('/oblamatik/device_name.txt')) {
		return file_get_contents('/oblamatik/device_name.txt');
	} else {
		return "";
	}
}

function set_device_name($name)
{
	$name = html_entity_decode(trim($name));
//	if (mb_strlen($name) > 32) {
//		$name = mb_substr($name, 0, 32);
//	}
	file_put_contents('/oblamatik/device_name.txt', $name);
}

function set_watchdog($time)
{
	$time *= 10;
	$time_h = intval($time / 16);
	$time_l = $time % 16;
	
	$command = "u" . chr($time_h + 48) . chr($time_l + 48) . ",";
	$out = write_command($command, 1);

	return $out;
}

function set_position($position)
{
	$command = "c" . $position . ",";
	$out = write_command($command, 1);

	return $out;
}

function set_warmup($temperature)
{
	open_valve(1, $address);

	$temp = intval(10 * $temperature);
	
	$c1 = intval($temp / 256);
	$c2 = intval(($temp % 256) / 16);
	$c3 = $temp - ($c1 * 256) - ($c2 * 16);

	$hextemp = chr($c1 + 48) . chr($c2 + 48) . chr($c3 + 48);

	$command = "l" . $hextemp . ",";
	$out = write_command($command, 1);

	return $out;
}

function set_color($r, $g, $b)
{
	$command = "m" . $r . "," . $g . "," . $b . ",";
	$out = write_command($command, 1);

	return $out;
}

function set_desinfect()
{
	open_valve(1, $address);

	$command = "n";
	$out = write_command($command, 1);

	return $out;
}

function set_temp($temperature)
{
	$temp = intval(10 * $temperature);
	
	$c1 = intval($temp / 256);
	$c2 = intval(($temp % 256) / 16);
	$c3 = $temp - ($c1 * 256) - ($c2 * 16);

	$hextemp = chr($c1 + 48) . chr($c2 + 48) . chr($c3 + 48);

	$command = "b" . $hextemp . ",";
	$out = write_command($command, 1);

	return $out;
}

function set_popup($position)
{
	$command = "f" . $position . ",";
	$out = write_command($command, 1);

	return $out;
}

function get_popup()
{
	$command = "g" . $position . ",";
	$out = read_command($command, 1);

	return intval($out);
}

function set_valve($valves)
{
	$valves = chr($valves + 48);
	$command = "h" . $valves . ",";
	$out = write_command($command, 1);

	return $out;
}

function get_temp_unit()
{
	if(file_exists("/tmp/TLC-Info.cfg"))
	{
 		$info = file("/etc/TLC-Config.cfg");                       
		foreach($info as $line)                                  
		{                                                        
			if(preg_match("/temperature_unit/", $line))
			{
				$tmp = explode(" = ", $line);
				$unit = trim(str_replace(';', '', $tmp[1]));
			}
		}
	}
	return($unit);
}

function set_temp_unit($unit)
{
	$command = "E" . $unit . ",";
	$out = write_command($command, 1);

	return $out;
}

function set_quick($number)
{
	open_valve(1, $address);

	$command = "a" . $number . ",";
	$out = write_command($command, 1);

	return $out;
}

function get_quick($number)
{
	if(file_exists("/tmp/TLC-Info.cfg"))
	{
		// Initiate that the TLC-Info.cfg is written with new values
		$command = "D";
		$out = read_command($command, 1);

                $info = file("/tmp/TLC-Info.cfg");                       
                foreach($info as $line)                                  
                {                                                        
			if(preg_match("/QA" . $number . "-temp/", $line))
			{
				$tmp = explode(" = ", $line);
				$temp = str_replace(';', '', $tmp[1]);
				$quick['temp'] = trim($temp);
			}
                        if(preg_match("/QA" . $number . "-flow/", $line))
                        {                                                                                                                                        
                                $tmp = explode(" = ", $line);                                                                                                    
                                $flow = str_replace(';', '', $tmp[1]);                                                                                           
                                $quick['flow'] = trim($flow);                                                                                                   
                        }                                                                                                                                        
                        if(preg_match("/QA" . $number . "-amount/", $line))
                        {                                                                                                                                        
                                $tmp = explode(" = ", $line);                                                                                                    
                                $amount = str_replace(';', '', $tmp[1]);                                                                                           
                                $quick['amount'] = trim($amount);                                                                                                   
                        }                                                                                                                                        
		}
	}
	else
	{
		$qa_h = read_eeprom(214 + (($number - 1) * 2), $address);
		$qa_l = read_eeprom(215 + (($number - 1) * 2), $address);
		$quick['temp'] = $qa_h * 256 + $qa_l;
		$quick['flow'] = 0;
		$quick['amount'] = 0;
	}
	return $quick;
}

function set_hygiene($time, $int)
{
	$d1 = intval($int / 4096);
	$d2 = intval(($int - ($d1 * 4096)) / 256);
	$d3 = intval(($int - ($d1 * 4096) - ($d2 * 256)) / 16);
	$d4 = $int % 16;

	$int = chr($d1 + 48) . chr($d2 + 48) . chr($d3 + 48) . chr($d4 + 48);

	$d1 = intval($time / 4096);
	$d2 = intval(($time - ($d1 * 4096)) / 256);
	$d3 = intval(($time - ($d1 * 4096) - ($d2 * 256)) / 16);
	$d4 = $time % 16;

	$time = chr($d1 + 48) . chr($d2 + 48) . chr($d3 + 48) . chr($d4 + 48);

	$command = "C" . $time . "," . $int . ",";
	$out = write_command($command, 1);
	return($out);
}

function set_measure($amount)
{
	$amount = $amount * 10;
	$d1 = intval($amount / 4096);
	$d2 = intval(($amount - ($d1 * 4096)) / 256);
	$d3 = intval(($amount - ($d1 * 4096) - ($d2 * 256)) / 16);
	$d4 = $amount % 16;

	$volume = chr($d1 + 48) . chr($d2 + 48) . chr($d3 + 48) . chr($d4 + 48);

	$command = "o" . $volume . ",";
	$out = write_command($command, 1);
	return($out);
}

function set_bath($amount, $temp)
{
	open_valve(1, $address);

	$amount = $amount * 10;                     
	$d1 = intval($amount / 4096);               
	$d2 = intval(($amount - ($d1 * 4096)) / 256);
	$d3 = intval(($amount - ($d1 * 4096) - ($d2 * 256)) / 16);
	$d4 = $amount % 16;                                       
                                                                  
	$volume = chr($d1 + 48) . chr($d2 + 48) . chr($d3 + 48) . chr($d4 + 48);

	$temp = intval(10 * $temp);                                      
                                                                                
	$c1 = intval($temp / 256);                                              
	$c2 = intval(($temp % 256) / 16);                                       
	$c3 = $temp - ($c1 * 256) - ($c2 * 16);                                 
                                                                                
	$temperature = chr($c1 + 48) . chr($c2 + 48) . chr($c3 + 48);               

	$command = "k" . $volume . "," . $temperature . ",";
	$out = write_command($command, 1);
	return($out);
}

function read_serial()
{
	$command = "Zd";
	
	$serial = read_command($command, 2);
	return($serial);
}

function get_temp()
{
	$command = "d";
	$out = read_command($command, 1);

	$d1 = ord($out[0]) - 48;
	$d2 = ord($out[1]) - 48;
	$d3 = ord($out[2]) - 48;
	
	$temp = intval(($d1 * 256) + ($d2 * 16) + $d3) / 10;

	return($temp);
}

function get_flow()
{
	$command = "e";
	$out = read_command($command, 1);

	$d1 = ord($out[0]) - 48;
	$d2 = ord($out[1]) - 48;
	$d3 = ord($out[2]) - 48;
	$d4 = ord($out[3]) - 48;
	
	$flow = intval(($d1 * 4096) + ($d2 * 256) + ($d3 * 16) + $d4) / 10;
	return($flow);
}

function set_flow($flow)
{
	$flow = intval(100 * $flow);
	$flow = fix_flow($flow);
	
	$flow_h = intval($flow / 16);
	$flow_l = $flow % 16;
	
	$command = "p" . chr($flow_h + 48) . chr($flow_l + 48) . ",";
	$out = write_command($command, 1);

	return($out);
}

/**
 * TLC Bathtub turns off when flow is set to less than 22%.
 * Thus allowed minimum of 5% should translate to 22%.
 *
 * @param $flow integer 5 .. 100
 * @return integer 22 .. 100
 */
function fix_flow($flow) {
	// 5 .. 100 -> 22 .. 100
	$flow = max(min(100, $flow), 5);

	return round(22 + 78/95 * ($flow - 5));
}

function get_state()
{
	$command = "s";
	$out = read_command($command, 1);

	$tmp = explode(',', $out);
	$state['state'] = $tmp[0];

	switch(sizeof($tmp))
	{
		case 1:
			$state['state'] = $tmp[0];
			$state['progress'] = 0;
			$state['set'] = 0;
			break;
		case 2:
			if(strlen($tmp[1]) == 3)
			{
				$d1 = ord($tmp[1][0]) - 48;
				$d2 = ord($tmp[1][1]) - 48;
				$d3 = ord($tmp[1][2]) - 48;
				$state['set'] = intval(($d1 * 256) + ($d2 * 16) + $d3) / 10;
				$state['progress'] = 0;
			}
			else
			{
				$d1 = ord($tmp[1][0]) - 48;
				$d2 = ord($tmp[1][1]) - 48;
				$state['progress'] = intval(($d1 * 16) + $d2) / 100;
				$state['set'] = 0;
			}
			break;
		case 3:
                        if(strlen($tmp[1]) == 3)    
                        {                          
                                $d1 = ord($tmp[1][0]) - 48;
                                $d2 = ord($tmp[1][1]) - 48;
                                $d3 = ord($tmp[1][2]) - 48;
                                $state['set'] = intval(($d1 * 256) + ($d2 * 16) + $d3) / 10;
                                $state['progress'] = 0;                                     
                        }                                                                   
                        else                                                                
                        {                                                                   
                                $d1 = ord($tmp[1][0]) - 48;                                 
                                $d2 = ord($tmp[1][1]) - 48;                                 
                                $state['progress'] = intval(($d1 * 16) + $d2) / 100;         
                                $state['set'] = 0;                                          
                        }                                                                   
                        if(strlen($tmp[2]) == 3)    
                        {                          
                                $d1 = ord($tmp[2][0]) - 48;
                                $d2 = ord($tmp[2][1]) - 48;
                                $d3 = ord($tmp[2][2]) - 48;
                                $state['set'] = intval(($d1 * 256) + ($d2 * 16) + $d3) / 10;
                                $state['progress'] = 0;                                     
                        }                                                                   
                        else                                                                
                        {                                                                   
                                $d1 = ord($tmp[2][0]) - 48;                                 
                                $d2 = ord($tmp[2][1]) - 48;                                 
                                $state['progress'] = intval(($d1 * 16) + $d2) / 100;         
                                $state['set'] = 0;                                          
                        }                                                                   

	}
	return($state);
}

function get_errors()
{
	$command = "z";
	$out = read_command($command, 1);

	return($out);
}

function read_eeprom($addr)
{
	$a1 = intval($addr / 16);
	$a2 = $addr % 16;
	$addr = chr($a1 + 48) . chr($a2 + 48);

	$command = "i" . $addr . ",";
	$out = read_command($command, 1);

	$d1 = ord($out[0]) - 48;
	$d2 = ord($out[1]) - 48;
	$value = ($d1 * 16) + $d2;
	return($value);
}

function write_eeprom($addr, $data)
{
	$a1 = intval($addr / 16);
	$a2 = $addr % 16;
	$d1 = intval($data / 16);
	$d2 = $data % 16;

	$eeaddr = chr($a1 + 48) . chr($a2 + 48);
	$eedata = chr($d1 + 48) . chr($d2 + 48);

	$command = "j" . $eeaddr . "," . $eedata . ",";
	$out = write_command($command, 1);
	return($out);
}

function set_stop()
{
	$command = "t";
	$out = write_command($command, 1);

	return($out);
}

function set_reset()
{
	$command = "Zc";
	$out = write_command($command, 2);

	return($out);
}

function get_stats()
{
	$command = "w";
	$out = read_command($command, 1);

	return($out);
}

function get_id()
{
	$command = "Za";
	$out = read_command($command, 2);

	return($out);
}

function is_bath() {
    return intval(get_type()) === 4;
}

function get_max_amount()
{
	$command = "F";
	$out = read_command($command, 1);

	$d1 = ord($out[0]) - 48;
	$d2 = ord($out[1]) - 48;
	$d3 = ord($out[2]) - 48;
	$d4 = ord($out[3]) - 48;
	
	$temp = intval(($d1 * 4096) + ($d2 * 256) + ($d3 * 16) + $d4);

	return($temp);
}

function set_max_amount($amount)
{
	$temp = intval($amount);

	$c1 = intval($temp / 4096);
	$c2 = intval(($temp - ($c1 * 4096)) / 256);
	$c3 = intval(($temp - ($c1 * 4096) - ($c2 * 256)) / 16);
	$c4 = $temp % 16;
        
	$hextemp = chr($c1 + 48) . chr($c2 + 48) . chr($c3 + 48) . chr($c4 + 48);

	$command = "G" . $hextemp . ",";
	$out = write_command($command, 1);

	return $out;
}

function read_command($command, $len)
{
	$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
	$out = "";

	$crc = crc16('F' . $command);

	if ($socket === false)
		return(0);

	$flag = pack("C2", 0x80, 0x46);
	$stop = pack("C1", 0x0D);
	$payload = $flag . $command . $crc . $stop;

	$service_port = "2001";

	$result = socket_connect($socket, '127.0.0.1', $service_port);
	if ($result === false)
		return(0);

	socket_write($socket, $payload, strlen($payload));
	$out = socket_read($socket, 2048, PHP_NORMAL_READ);

	// Did we get a function update?
	if($out[2] == 'y')
		$out = socket_read($socket, 2048, PHP_NORMAL_READ);
	socket_close($socket);
	
	// extract returned data and crc
	$crc = substr($out, strlen($out) - 5, 4);
	$data = substr($out, 1, strlen($out) - 6);
	
	$check = crc16($data);
	
	if($crc == $check)
	{
		$out = substr($data, $len + 1, strlen($data) - $len - 2);
		$out = str_replace('"', '', $out);
	}
	else
		$out = 0;

	return($out);
}

function write_command($command)
{
	$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
	$out = "";

	$crc = crc16('F' . $command);

	if ($socket === false)
		return(0);

	$flag = pack("C2", 0x80, 0x46);
	$stop = pack("C1", 0x0D);
	$payload = $flag . $command . $crc . $stop;

	$service_port = "2001";

	$result = socket_connect($socket, '127.0.0.1', $service_port);
	if ($result === false)
		return(0);

	socket_write($socket, $payload, strlen($payload));
	$out = socket_read($socket, 2048, PHP_NORMAL_READ);

	// Did we get a function update?
	if($out[2] == 'y')
		$out = socket_read($socket, 2048, PHP_NORMAL_READ);

	socket_close($socket);

	return($out);
}

function crc16($data)
{
	$crc = 0xFFFF;
	for ($i = 0; $i < strlen($data); $i++)
	{
		$x = (($crc >> 8) ^ ord($data[$i])) & 0xFF;
		$x ^= $x >> 4;
		$crc = (($crc << 8) ^ ($x << 12) ^ ($x << 5) ^ $x) & 0xFFFF;
	}

	$hex = sprintf('%04x', $crc);
	
//	echo $crc . " : " . $hex . "\n";
	
	for($i = 0; $i < 4; $i++)
	{
		if(ord($hex[$i]) > 57)
			$hex[$i] = chr(ord($hex[$i]) - 39);
	}
	return $hex;
 }

function logtofile($log)
{
	if(0)
	{
		$timestamp = time();
		$time = date("H:i:s",$timestamp) . "\n";
		file_put_contents("/var/log/lighttpd/debug.txt", $time, FILE_APPEND);
		file_put_contents("/var/log/lighttpd/debug.txt", $log, FILE_APPEND);
	}
}

function check_input($type, $value, $min, $max)
{
	switch($type)
	{
		case "num":
			if((is_numeric($value) && $value >= $min) && ($value <= $max))
				return 1;
			else
				return 0;
			break;
	}
}

function check_token()
{
	if($_SERVER['REMOTE_ADDR'] == '127.0.0.1')
		return(1);
	else
		return(1);

//	$token = file_get_contents("/var/log/lighttpd/" . $_SERVER['REMOTE_ADDR']);
//	$headers = getallheaders();
//	$received = $headers['X-Xsrf-Token'];

//	if($token == $received)
//		return(1);
//	else
//		return(0);
}

function check_iot($path)
{
	// Check if all files are extracted from firmware.bin archive
	if(file_exists("/tmp/" . $path . "/iot.bin") && file_exists("/tmp/" . $path . "/iot.bin.asc") && file_exists("/tmp/" . $path . "/iot.ver") && file_exists("/tmp/" . $path . "/iot.ver.asc"))
	{
		exec("/usr/bin/sudo /usr/bin/gpg --verify /tmp/" . $path . "/iot.bin.asc", $out, $return);
		if($return)
		{
			$array['status'] = 901;
			$array['duration'] = 0;
			$array['version'] = 0;
			return($array);
		}
		else
		{
			// Check version file
			exec("/usr/bin/sudo /usr/bin/gpg --verify /tmp/" . $path . "/iot.ver.asc", $out, $return);
			if($return)
			{
				$array['status'] = 902;
				$array['duration'] = 0;
				$array['version'] = 0;
				return($array);
			}
			else
			{
				$array['status'] = 200;
				$array['duration'] = 300;
				$array['version'] = trim(file_get_contents("/tmp/" . $path . "/iot.ver"));
				return($array);
			}
		}
	}
	else
	{
		$array['status'] = 900;
		$array['duration'] = 0;
		$array['version'] = 0;
		return($array);
	}
}

function getUptime($divisor = 60)
{
	$uptime = file_get_contents("/proc/uptime");
	$up = explode(" ", $uptime);
	return intval($up[0] / $divisor);
}

function getKernel()
{
	return trim(php_uname('r'));
}

function usage($free, $total)
{
	$used = $total - $free;
	return round(($used / $total) * 100) . "% (" . $used . "/" . $total . ", " . $free . "KB free)";
}

function getDiskUsage($path = "/")
{
	$free = intval(disk_free_space($path) / 1024);
	$total = intval(disk_total_space($path) / 1024);
	return usage($free, $total);
}

function getMemUsage()
{
	$mem = file("/proc/meminfo");
	$matches = null;
	preg_match_all('!\d+!', $mem[0], $matches);
	$total = $matches[0][0];
	preg_match_all('!\d+!', $mem[1], $matches);
	$free = $matches[0][0];
	return usage($free, $total);
}

function isWifiIfaceEnabled($num)
{
	return intval(shell_exec("/usr/bin/sudo /sbin/uci get wireless.@wifi-iface[" . $num . "].disabled")) === 0;
}

function isApEnabled()
{
	return isWifiIfaceEnabled(1);
}

function isStaEnabled()
{
	return isWifiIfaceEnabled(0);
}

function isWifiEnabled()
{
	$out = shell_exec("/usr/bin/sudo /sbin/wifi status");
	$status = json_decode($out);
	return (property_exists($status, 'radio0') && property_exists($status->radio0, 'up')) ? $status->radio0->up : false;
}

function getControllerInfo()
{
	$data = [
		'tlc_temp' => null,
		'flow' => null,
	];
	if (is_tlc()) {
		$data['tlc_temp'] = false;
		$data['flow'] = get_flow();
	} else {
		$data['tlc_temp'] = true;
		$data['flow'] = 0;
	}
	return $data;
}

function getIpAddress($interface)
{
	$ifstatus = json_decode(shell_exec("/usr/bin/sudo /sbin/ifstatus " . $interface));
	if (
		property_exists($ifstatus, 'up')
		&&
		$ifstatus->up === true
		&&
		property_exists($ifstatus, 'ipv4-address')
		&&
		is_array($ifstatus->{'ipv4-address'})
		&&
		count($ifstatus->{'ipv4-address'}) > 0
		&&
		property_exists($ifstatus->{'ipv4-address'}[0], 'address')
	) {
		return $ifstatus->{'ipv4-address'}[0]->address;
	}
	return null;
}

function getRadioInfo($device = 'wlan0')
{
	$data = [
		'ssid' => null,
		'quality' => null,
	];
	$output = null;
	$return = null;
	exec("/usr/bin/sudo /usr/sbin/iwconfig " . $device, $output, $return);
	foreach ($output as $line) {
		if (0 === strpos($line, $device)) {
			$pos = strpos($line, "ESSID:");
			if ($pos !== false) {
				$data['ssid'] = trim(substr($line, $pos + 6), '"');
			}
		} else {
			$pos = strpos($line, 'Link Quality=');
			if ($pos !== false) {
				$signal = str_replace('Link Quality=', '', trim($line));
				$signal = explode(' ', $signal);
				$ratio = $signal[0];
				$values = explode('/', $ratio);
				$data['quality'] = round(($values[0] / $values[1]) * 100) . "%";
			}
		}
	}
	return $data;
}

function labelType()
{
	$type = intval(get_type());
	if ($type > 4)
		$type -= 4;
	switch ($type) {
		case 1:
			return "kitchen";
		case 2:
			return "washbasin";
		case 3:
			return "shower";
		case 4:
			return "bathtub";
	}
	return null;
}

function scan_wlans()
{
	$filter = array('/smart-/', '/tlc-/', '/twinlevel-/', '/Hygiene-/', '/crosswater/', '/trio-e-/', '/RN-TC-/');

	exec('/usr/bin/sudo /usr/sbin/iwlist wlan0 scan', $return);
	file_put_contents("/tmp/wlans.txt", print_r($return, true));

	$wlans = array();

	$lastcell = 0;
	$cell = 0;

	foreach ($return as $line) {
		$line = ltrim($line);
		if (preg_match('/Cell /', $line)) {
			// We found a Cell comment, meaning a new section starts
			$temp = explode(" ", $line);
			$cell = intval($temp[1]);
		}
		if ($cell > $lastcell) {
			if (preg_match('/Quality/', $line)) {
				// We found the signal strength in the same section
				$signal = str_replace('Quality=', '', $line);
				$signal = explode(' ', $signal);
				$signal = explode('/', $signal[0]);
				$rawsignal = $signal[0];
				$signal = floor(($rawsignal + 17) / 17.5);
				$wlans[$cell]['signal'] = $signal;
				$wlans[$cell]['rawsignal'] = $rawsignal;
			}
			if (preg_match('/ESSID/', $line)) {
				// We found the SSID name
				$wlan = str_replace('ESSID:', '', $line);
				$wlan = substr($wlan, 1, strlen($wlan) - 2);
				foreach ($filter as $element) {
					if (preg_match($element, $wlan)) {
						// We found an SSID we should filter out
						$wlan = '';
					}
				}
				if ($wlan) {
					$wlans[$cell]['name'] = $wlan;
					$lastcell = $cell;
				} else {
					// We have an empty SSID
					unset($wlans[$cell]);
					$lastcell = $cell;
				}
			}
		}
	}
	usort($wlans, function ($a, $b) {
		return $b['rawsignal'] - $a['rawsignal'];
	});

	$doubles = array();
	foreach ($wlans as $wlan) {
		// Now walk through all entries to remove any double entry
		// Only remove the double one with the weaker signal
		if (!in_array($wlan['name'], $doubles)) {
			$array[] = $wlan;
			$doubles[] = $wlan['name'];
		}
	}

	return $array;
}