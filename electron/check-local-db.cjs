const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Windows typical Electron userData path
const dbPath = `C:\\Users\\NMT\\AppData\\Roaming\\aoi-dashboard\\master.db`;

console.log("---------------------------------------------------");
console.log("EXPECTED DATABASE PATH:");
console.log(dbPath);
console.log("Exists?", fs.existsSync(dbPath));
console.log("---------------------------------------------------");

if (fs.existsSync(dbPath)) {
    const db = new sqlite3.Database(dbPath);
    console.log("Checking tables...");
    db.all(`SELECT name FROM sqlite_master WHERE type='table'`, [], (err, tables) => {
        console.log("Tables:", tables);
        if (tables.find(t => t.name === 'records')) {
            db.all(`SELECT count(*) as count FROM records`, [], (err, res) => {
                console.log("Row count:", res);
            });
            db.all(`SELECT * FROM records LIMIT 5`, [], (err, rows) => {
                console.log("Rows:", rows);
            });
        }
    });
} else {
    console.log("Database file not found yet. App might not have synced.");
}
