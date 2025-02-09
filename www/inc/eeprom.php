<?php

function read_eeprom2($address) {
    $l = read_eeprom($address);
    $h = read_eeprom($address + 1);
    return $h * 256 + $l;
}

$data = [];

echo "<pre>";

$eTLC_Mode = read_eeprom(0);

$data['eTLC_Mode'] = $eTLC_Mode;
$data['type'] = get_type();
$data['popUp'] = has_popup();

$data['eML_VerEEPROM_VK'] = read_eeprom(82);
$data['eML_VerEEPROM_NK'] = read_eeprom(81);
$data['display'] = $data['eML_VerEEPROM_VK'] === 20;

if ($data['display']) {
    // V20.XXX
    $data['sicherheitsstop-V20'] = read_eeprom2(214);
} else {
    // V12.XXX
    $data['sicherheitsstop-V12'] = read_eeprom2(12);
}

$data['eV_Quick_1_Init'] = read_eeprom(32);
$data['eT_Quick_1_Init'] = read_eeprom(33);
$data['eF_Quick_1_Init'] = read_eeprom2(34);
$data['eV_Quick_2_Init'] = read_eeprom(36);
$data['eT_Quick_2_Init'] = read_eeprom(37);
$data['eF_Quick_2_Init'] = read_eeprom2(38);
$data['eV_Quick_3_Init'] = read_eeprom(40);
$data['eT_Quick_3_Init'] = read_eeprom(41);
$data['eF_Quick_3_Init'] = read_eeprom2(42);

$data['eV_Quick_1_Aktuell'] = read_eeprom(216);
$data['eT_Quick_1_Aktuell'] = read_eeprom(217);
$data['eF_Quick_1_Aktuell '] = read_eeprom2(218);
$data['eV_Quick_2_Aktuell'] = read_eeprom(220);
$data['eT_Quick_2_Aktuell'] = read_eeprom(221);
$data['eF_Quick_2_Aktuell '] = read_eeprom2(222);
$data['eV_Quick_3_Aktuell'] = read_eeprom(224);
$data['eT_Quick_3_Aktuell'] = read_eeprom(225);
$data['eF_Quick_3_Aktuell '] = read_eeprom2(226);

foreach ($data as $key => $value) {
    echo $key . "\t" . $value . PHP_EOL;
}

echo "</pre>";
