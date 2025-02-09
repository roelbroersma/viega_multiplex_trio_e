<?php

$db = new SQLite3("/oblamatik/events.db");
$db->busyTimeout(5000);

$maxEntries = 200;

$db->exec("
delete
from event
where eventid not in (
    select eventid
    from event
    order by eventid desc
    limit " . $maxEntries . "
)");
$db->exec("vacuum");
$db->close();
?>
