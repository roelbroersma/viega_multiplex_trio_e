<?php
	$db = new SQLite3("/oblamatik/events.db");
	$db->busyTimeout(500);
	header('Content-Type: text/plain');
	switch(sizeof($command))
	{
		case 1:
			$result = $db->query("select * from event order by eventid desc");
			break;
		case 2:
			$count = $command[1];
			$result = $db->query("select * from event order by eventid desc limit $count offset 0");
			break;
		case 3:
			$count = $command[1];
			$offset = $command[2];
			$result = $db->query("select * from event order by eventid desc limit $count offset $offset");
			break;
	}

	while($row = $result->fetchArray())
	{
		if($_SERVER['REMOTE_ADDR'] == "127.0.0.1")
		{
			$tmp['eventid'] = $row['eventid'];
			$tmp['time'] = $row['time'];
			$tmp['event'] = $row['event'];
			$tmp['info'] = $row['info'];
			$array[] = $tmp;
		}
		else
		{
			echo $row['eventid'] . ";";
			echo $row['time'] . ";";
			echo $row['event'] . ";";
			echo $row['info'] . ";";
			echo "\n";
		}
	}
	if($_SERVER['REMOTE_ADDR'] == "127.0.0.1")
		echo json_encode($array);
?>
