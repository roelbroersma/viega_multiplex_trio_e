<?php

	switch($size)
	{
		case 3:
			if($_POST)
				do_measure($command[1]);
			else
				get_measure_state($command[1]);
			break;
		case 4:
			if($_POST)
				do_save_measure($command[1]);
			else
				do_get_measure($command[1]);
			break;
	}


function do_measure($id)
{
	$out = print_r($_POST, true);
	file_put_contents("/tmp/log/lighttpd/measure-post-" . $id . ".txt", $out);
	
	$temp = number_format($_POST['quantity'], 1);
	file_put_contents("/tmp/log/lighttpd/measure-post-" . $id . ".txt", $temp . "\n", FILE_APPEND);

	set_measure($temp);
}

function get_measure_state($id)
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

function do_save_measure($id)
{
	$amount = $_POST['amount'];
	
	$out = print_r($_POST, true);
	file_put_contents("/tmp/log/lighttpd/measure-post.txt", $out);
	
	file_put_contents("/tmp/measure_amount.txt", $amount);
}

function do_get_measure($id)
{
	if(file_exists("/tmp/measure_amount.txt"))
	{
		$amount = file_get_contents("/tmp/measure_amount.txt");
		if(!is_numeric($amount))
			$amount = 10;
	}
	else
		$amount = 10;
		
	$array['amount'] = $amount;
	header('Content-Type: application/json');
	echo json_encode($array);
}
?>
