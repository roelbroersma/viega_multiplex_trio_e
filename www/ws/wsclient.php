<?php
	include("/www/inc/functions.php");
	include("/www/config/branding.php");
	require('vendor/autoload.php');

	exec('/bin/ps', $result);
	$processes = 0;
	foreach($result as $process)
	{
		if(preg_match("/php-cgi.*wsclient.php/", $process))
		{
			echo "Found process: " . $process . "\n";
			$processes++;
			echo "Number of process: " . $processes . "\n";
		}
	}
	if($processes > 1)
		exit;

	$server = $branding['socket'];

	use WebSocket\Client;

	if(file_exists("/tmp/channel.txt"))
	{
		$channel = trim(file_get_contents("/tmp/channel.txt"));
		if(strlen($channel) > 10)
			$client = new Client("wss://" . $server . "/ws/" . $channel . "?subscribe-broadcast&publish-broadcast");
		else
		{
			echo "Channel value too short...\n";
			exit;
		}
	}
	else
	{
		echo "No channel found...\n";
		exit;
	}

	$tick = 0;

while(1)
{
	$newchannel = trim(file_get_contents("/tmp/channel.txt"));

	if($channel != $newchannel)
		exit;

	$msg = $client->receive();
	$opcode = $client->getLastOpcode();
	echo "Opcode: " . $opcode . "\n";
	switch($opcode)
	{
		case 'text':
			echo $msg . "\n";
			if(is_object(json_decode($msg)))
			{
				$obj = json_decode($msg);
//				print_r($obj);
				switch($obj->method)
				{
					case 'GET':
						$result = socket_get($obj);
						$obj->data = $result;
						break;

					case 'POST':
						$result = socket_post($obj);
						$obj->data = $result;
						break;
				}
//				print_r($obj);
				$echo = json_encode($obj);
				echo "Msg: " . $echo . "\n";
				$client->send($echo);
			}
			else
			{
				if($msg == 'ping')
				{
					$tick++;
					file_put_contents("/tmp/ping.txt", $tick);
				}
			}
			break;
		case 'ping':
			$tick++;
			echo "Sending pong back...\n";
			$client->send('pong', 'pong');
			file_put_contents("/tmp/ping.txt", $tick);
			break;
		default:
			echo "Unknown opcode for: " . $msg ."\n";
			exit;
			break;
	}
	if($tick >= 1000)
		$tick = 0;
}

function socket_get($object)
{
	$logdir = "/var/log/lighttpd/";

	$url = $object->url;
	$hash = $object->hash;
	file_put_contents($logdir . "url.txt", $url . "\n");
	$info = json_decode(file_get_contents("/www/inc/info.txt"));
	$myhash = hash("sha512", $url . $info->password);
	if($hash != $myhash)
	{
		file_put_contents($logdir . "hash.txt", "Wrong hash received for " . $url . ", " . $hash . "\n");
		return;
	}

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, "https://127.0.0.1" . $url);
	curl_setopt($ch, CURLOPT_PORT, 443);
//	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Expect:  '));
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);

	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

	$out = curl_exec($ch);
	curl_close($ch);

	file_put_contents($logdir . "urlget.txt", $out . "\n");
	$data = json_decode($out);
//	print_r($data);
	return($data);
}

function socket_post($object)
{
	$logdir = "/var/log/lighttpd/";
	$url = $object->url;
	$hash = $object->hash;
	file_put_contents($logdir . "url.txt", $url . "\n");
	$info = json_decode(file_get_contents("/www/inc/info.txt"));
	$myhash = hash("sha512", $url . $info->password);
	if($hash != $myhash)
	{
		file_put_contents($logdir . "hash.txt", "Wrong hash received for " . $url . ", " . $hash . "\n");
		return;
	}

	$ch = curl_init();
	
	$post = print_r($object->data, true);
	file_put_contents($logdir . "socket_post.txt", $post);
	

	curl_setopt($ch, CURLOPT_URL, "https://127.0.0.1" . $url);
	curl_setopt($ch, CURLOPT_PORT, 443);
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($object->data));
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Expect:  '));
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);

	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

	$out = curl_exec($ch);
	curl_close($ch);

	return(json_decode($out));
}
?>

