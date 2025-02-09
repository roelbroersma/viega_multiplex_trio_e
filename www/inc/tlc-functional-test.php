<?php
	$out = print_r($_POST, true);
	file_put_contents('/tmp/log/lighttpd/tlc-test.txt', $out);

	$step = $command[4];

	file_put_contents("/tmp/function_test.txt", $step);
	
	switch($step)
	{
		case 0:
			if(is_tlc())
				set_reset();
			else
			{
				set_stop();
				set_color('00', '00', '00');
			}
			echo "200";
			break;

		case 1:
			open_valve(1);
			set_temp(80);
			if(is_tlc())
				set_flow(1);
			echo "200";
			break;

		case 2:
			open_valve(1);
			set_stop();
			set_color('00', '??', '00');
			echo "200";
			break;

		case 3:
			open_valve(1);
			set_temp(4);
			if(is_tlc())
				set_flow(1);
			echo "200";
			break;
	}
?>
