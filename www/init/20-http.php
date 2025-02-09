<?php
	if(!file_exists("/www/config/server.pem"))
	{
                file_put_contents("/tmp/startup.txt", "Generating web server certificate\n");
		// Generate lighttpd server certificate and key
		exec("/usr/bin/openssl genrsa -des3 -passout pass:" . $serialiot . " -out /tmp/server.pass.key 2048");
		exec("/usr/bin/openssl rsa -passin pass:" . $serialiot . " -in /tmp/server.pass.key -out /tmp/server.key");
		exec("/bin/rm /tmp/server.pass.key");
		exec('/usr/bin/openssl req -new -key /tmp/server.key -out /tmp/server.csr -sha256 -subj "/C=CH/ST=Graubuenden/L=Chur/O=Oblamatik AG/OU=Development/CN=oblamatik.ch"');
		exec("/usr/bin/openssl x509 -req -days 3650 -in /tmp/server.csr -signkey /tmp/server.key -out /tmp/server.crt");
		exec("/bin/cat /tmp/server.key /tmp/server.crt > /www/config/server.pem");
		exec("/etc/init.d/lighttpd restart");
	}
?>
