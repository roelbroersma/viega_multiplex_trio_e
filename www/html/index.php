<?php
	$token = base64_encode(openssl_random_pseudo_bytes(30));
	file_put_contents("/var/log/lighttpd/" . $_SERVER['REMOTE_ADDR'], $token);
	setcookie("XSRF-TOKEN", $token);
	
	$html = file_get_contents("/www/html/index-offline.html");
	echo $html;
?>
