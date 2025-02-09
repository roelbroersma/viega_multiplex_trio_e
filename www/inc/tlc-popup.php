<?php

	switch($size)
	{
		case 3:
			if($_POST)
				set_popup_state($command[1]);
			else
				get_popup_state($command[1]);
			break;

	}


function get_popup_state($id)
{
	$state = get_popup();

	$array = array();
	$array['state'] = $state;
	header('Content-Type: application/json');
	echo(json_encode($array));
}

function set_popup_state($id)
{
	$out = print_r($_POST, true);
	file_put_contents("/tmp/log/lighttpd/popup-post-" . $id . ".txt", $out);

	set_popup($_POST['state']);
	echo "200";
}
?>
