<?php
	include("/www/config/branding.php");

	exec("/sbin/uci set system.@system[0].hostname=" . $branding['hostname']);
	exec("/sbin/uci commit");

?>
