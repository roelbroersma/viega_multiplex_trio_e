<?php

$db = new SQLite3("/oblamatik/events.db");

$db->exec("CREATE TABLE IF NOT EXISTS event (
		eventid INTEGER PRIMARY KEY AUTOINCREMENT, 
		event INTEGER,
		time TEXT,
		info TEXT)");

exec("/bin/chmod 666 /oblamatik/events.db");

if (file_exists("/etc/timestamp")) {
	$time = file_get_contents("/etc/timestamp");
	date_default_timezone_set("UTC");
	$timestamp = date("Y-m-d H:i:s", $time);
	$db->exec("insert into event (event, time, info) values (1, '$timestamp', 'Stromausfall')");
}
$db->exec("insert into event (event, time, info) values (2, datetime('now'), 'Neustart')");

$db->close();
