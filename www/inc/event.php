<?php

date_default_timezone_set("Europe/Zurich");
$db = new SQLite3("/oblamatik/events.db");
$query = "select * from event order by eventid desc";
$result = $db->query($query);
echo "<pre>";
echo "<table><tr><th width=\"60\">ID</th><th width=\"60\">Event</th><th width=\"100\">Datum</th><th width=\"100\">Zeit</th><th>Ereignis</th></tr>";
while ($row = $result->fetchArray()) {
	echo "<tr>";
	echo "<td>" . $row['eventid'] . "</td>";
	echo "<td>" . $row['event'] . "</td>";
	echo "<td>" . date("d.m.Y", strtotime($row['time'])) . "</td>";
	echo "<td>" . date('H:i:s', strtotime(date("Y-m-d\TH:i:s\Z", strtotime($row['time'])))) . "</td>";
	echo "<td>" . $row['info'] . "</td>";
	echo "</tr>";
}
echo "</table>";
