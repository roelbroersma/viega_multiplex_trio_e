<?php
	exec("/sbin/uci set wireless.radio0.disabled=0");
	exec("/sbin/uci commit");
	exec("/sbin/wifi reload");
