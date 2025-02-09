<?php

	switch($size)
	{
		case 3:
			if($_POST)
				do_warmup($command[1]);
			else
				get_warmup_state($command[1]);
			break;
	}


function do_warmup($id)
{
	$out = print_r($_POST, true);
	file_put_contents("/tmp/log/lighttpd/warmup-post-" . $id . ".txt", $out);
	
	$temp = number_format($_POST['temperature'], 1);
	file_put_contents("/tmp/log/lighttpd/warmup-post-" . $id . ".txt", $temp . "\n", FILE_APPEND);

	set_warmup($temp);
}

function get_warmup_state($id)
{
	$state = get_state();

	switch($state['state'])
	{
		case 'a':
			$array['state'] = 2;
			break;

		case 'c':
			$array['state'] = 1;
			break;
	}

	header('Content-Type: application/json');
	echo(json_encode($array));
}
?>
