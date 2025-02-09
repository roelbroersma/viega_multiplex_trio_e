<?php

	switch($size)
	{
		case 4:
			if(isset($_POST['data']))
				set_quick_state($command[1], $command[3]);
			else
				get_quick_state($command[1], $command[3]);
			break;
	}


function set_quick_state($id, $number)
{
	$out = print_r($_POST, true);
	file_put_contents("/tmp/log/lighttpd/quick-post-" . $id . ".txt", $out);

	set_quick($number);
	echo "200";
}

function get_quick_state($id, $number)
{
	$out = print_r($_POST, true);
	file_put_contents("/tmp/log/lighttpd/quick-get-" . $id . ".txt", $out);
	$quick = get_quick($number);
	$array['temperature'] = $quick['temp'] / 10;
	$array['flow'] = $quick['flow'] / 100;
	$array['amount'] = $quick['amount'] / 10;
	header('Content-Type: application/json');
	echo json_encode($array);
}
?>
