# Viega Multiplex Trio E
The official software running on the Wifi module for the Viega Multiplex Trio E. See WIKI for more info and mods!

The Wifi module is a Carambola 2 (by 8devices: https://8devices.com), on a small PCB with an RS232 chip and some stepdowns for the power supply of the Carambola 2.
Connected by a 4 wire cable (on a 6pin JST-XH connector): GND, RX, TX, VCC. The RX/TX/GND is a RS232 signal.

It's running a webserver (lighthttpd) with some .php files. It uses a web API, see this Github REPO for more info about the Web API: https://github.com/AxelTerizaki/homebridge-trio-e

It sends and receives RS232 commands.


If you want to clone this or build your own module (Raspberry Pi 2 Zero W) which sends the serial signals, please remember that you need an converter chip like the MAX3232 to convert the 3.3v UART of the PI or an ESP to the RS232 signal (which can be 12V).
