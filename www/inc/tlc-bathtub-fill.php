<?php

	switch($size)
	{
		case 3:
			if($_POST)
				do_bathtub($command[1]);
			else
				get_bathtub_state($command[1]);
			break;
	}


function do_bathtub($id)
{
	$out = print_r($_POST, true);
	file_put_contents("/tmp/log/lighttpd/bathtub-post-" . $id . ".txt", $out);
	
	$volume = number_format($_POST['amount'], 1, ".", "");
	file_put_contents("/tmp/log/lighttpd/bathtub-post-" . $id . ".txt", $volume . "\n", FILE_APPEND);

        $temp = number_format($_POST['temperature'], 1);                  
        file_put_contents("/tmp/log/lighttpd/bathtub-post-" . $id . ".txt", $temp . "\n", FILE_APPEND);

	set_bath($volume, $temp);
}

function get_bathtub_state($id)
{
	$state = get_state();
	
	switch($state['state'])
	{
		case 'a':
			$array['state'] = 2;
			break;

		case 'c':
		case 'h':
		case 'i':
			$array['state'] = 1;
			break;

		case 'x':
			$array['state'] = 0;
			break;
	}
	header('Content-Type: application/json');
	echo(json_encode($array));
	file_put_contents("/tmp/log/lighttpd/bathtub.txt", "Bathtub state: " . json_encode($array) . "\n", FILE_APPEND);
}
?>
