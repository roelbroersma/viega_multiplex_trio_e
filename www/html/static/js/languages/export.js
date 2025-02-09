/**
 * This script is a helper to export the translation files to csv.
 * 1) Insert object with keys and translations below
 * 2) Run node export.js > export.csv
 */
var translations = {
    // KEY: 'translation', ...

};

function escapeCsv(text) {
    return '"' + text.split('"').join('""') + '"';
}

console.log("\ufeffKey;Translation");
for (var key in translations) {
    console.log(escapeCsv(key) + ";" + escapeCsv(translations[key]));
}

