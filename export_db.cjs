const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'master.db');
const outputPath = path.join(__dirname, 'public/data.json');

const db = new sqlite3.Database(dbPath);

const exportData = async () => {
    const getData = (sql) => new Promise((resolve, reject) => {
        db.all(sql, [], (err, rows) => err ? reject(err) : resolve(rows));
    });

    try {
        const records = await getData("SELECT * FROM records");
        const throughput = await getData("SELECT * FROM throughput");

        const data = {
            records,
            throughput
        };

        if (!fs.existsSync(path.join(__dirname, 'public'))) {
            fs.mkdirSync(path.join(__dirname, 'public'));
        }

        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`Data exported to ${outputPath}`);
    } catch (err) {
        console.error("Export failed:", err);
    } finally {
        db.close();
    }
};

exportData();
