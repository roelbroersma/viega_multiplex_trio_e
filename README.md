# Viega Multiplex Trio E
The official software running on the Wifi module for the Viega Multiplex Trio E.
Viega officially said they are not building new modules and are selling their stock. That's the reason this Github REPO exists, so you build your own module!


## Hardware
The Wifi module is a Carambola 2 (by 8devices: https://8devices.com), on a small PCB with an RS232 chip and some stepdowns for the power supply of the Carambola 2.
Connected by a 4 wire cable (on a 6pin JST-XH connector): GND, RX, TX, VCC. The RX/TX/GND is a RS232 signal.
![image](https://github.com/user-attachments/assets/05680862-cc1d-48a4-8b3e-6fdac5fcb3ce)


## Software
It's running a webserver (lighthttpd) with some .php files. It uses a web API, see this Github REPO for more info about the Web API: https://github.com/AxelTerizaki/homebridge-trio-e

It sends and receives RS232 commands.

## Connect a console to the Wifi Module (via serial)
Solder a RX (pin 43), TX (pin 44) and GND (pin 47) wire to the Carambola 2 module, this is quite simple because the solder points are quite big.
![image](https://github.com/user-attachments/assets/b6444457-95e1-4051-a275-cfd323a621c6)
Keep it connected to the Viega Multiplex Trio E unit because of the poswer supply.
You need an MAX3232 chip to convert the TTL signals of the Carambola 2 to RS232 (to your laptop).
```CARAMBOLA2 <-----> MAX3232 CHIP <------>  SERIAL-TO-USB CABLE in LAPTOP```
There are also all-in-one RS232-TTL converters (even with USB) for just a few euro.
I did it with a Startech ICUSB2321F Serial to USB cable because it has an FTDI FT232RL Chipset which always works and doens't need any drivers for windows. I used a Breadboard, a MAX3232 chip and some Dupont wires. If you use al all-in-one RS232-TTL-USB cable, you don't need this.
Use your favorite console tool (TerraTerm, SecureCRT or Putty) and connect to the COM port. Console settings are: 115200, 8, N, 1.

When booting you see the serial data on your console. During boot (after about 7 seconds), press **f** (followed by **ENTER**) to abort the boot process and enter failsafe mode. I you don't do this, you will lose console because the software will switch the UART to 9600 8, N, 1 because of writing commands to the Viega Multiplex Trio E. So you need to abort the boot process.
If you abort the boot process, you don't have Wifi (and although the Carambola 2 has a Wifi controller, there is no RJ45 port on the Wifi module).
To enable WIFI, scan for SSID's, paste the following to the console:

```ls /lib/modules/$(uname -r)/ | grep ath
modprobe ath9k
ifconfig wlan0 up
iw dev wlan0 scan | grep SSID```

To connect to an SSID and obtain an IP address using dhcp client, change the My_SSID and My_Secret_Password and paste it into the console:
```mkfifo /tmp/wpa.conf
(
  echo 'network={'
  echo '    ssid="My_SSID'
  echo '    psk="My_Secret_Password"'
  echo '    key_mgmt=WPA-PSK'
  echo '}'
) > /tmp/wpa.conf &
wpa_supplicant -B -i wlan0 -c /tmp/wpa.conf
udhcpc -i wlan0
ifconfig wlan0
ip a
```
You will see the IP address.

I created a folder in tmp (because that is the only Read-Write filesystem, the others are mounted Read-Only):
```mkdir -p /var/tmp```

Created a .tar with some files I wanted to get and setup a webserver using this:
```
echo 'server.port = 8081
server.document-root = "/"
dir-listing.activate = "enable"
server.errorlog = "/dev/null"
server.pid-file = "/var/run/lighttpd.pid"
server.dir-listing-hide-dotfiles = "false"
' > /tmp/lighttpd.conf

lighttpd -f /tmp/lighttpd.conf
```

Now you can access the file system under: http://<ip_address>:8081/


## Building your own Wifi module
If you want to clone this or build your own module (Raspberry Pi 2 Zero W) which sends the serial signals, please remember that you need an converter chip like the MAX3232 to convert the 3.3v UART of the PI or an ESP to the RS232 signal (which can be 12V).
All needed files (mainly the /www/ ) are in this repository.
