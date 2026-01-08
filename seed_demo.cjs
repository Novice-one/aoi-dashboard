const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'master.db');
const db = new sqlite3.Database(dbPath);

const seedData = () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const cameras = ['F11', 'F12', 'F21', 'F22', 'R11', 'R12'];
    const ngTypes = ['ColorDiff', 'Scratch', 'Stain', 'Chip', 'Broken'];

    db.serialize(() => {
        const stmtRecord = db.prepare("INSERT INTO records (source_id, source_camera_id, camera_id, ng_type, wafer_id, created_at) VALUES (?, ?, ?, ?, ?, ?)");
        const stmtTp = db.prepare("INSERT OR REPLACE INTO throughput (source_host, camera_id, date, hour, total_count) VALUES (?, ?, ?, ?, ?)");

        [today, yesterday].forEach(date => {
            cameras.forEach(cam => {
                // Throughtput for each hour
                for (let h = 0; h < 24; h++) {
                    const totalCount = Math.floor(Math.random() * 50) + 100; // 100-150 pieces per hour
                    stmtTp.run('demo_host', cam, date, h, totalCount);

                    // Random defects (1-5 per hour)
                    const defectCount = Math.floor(Math.random() * 5);
                    for (let i = 0; i < defectCount; i++) {
                        const ngType = ngTypes[Math.floor(Math.random() * ngTypes.length)];
                        const time = `${h.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00`;
                        stmtRecord.run(Math.floor(Math.random() * 100000), 'demo_host', cam, ngType, `WAFER-${Math.floor(Math.random() * 1000)}`, `${date}T${time}`);
                    }
                }
            });
        });

        stmtRecord.finalize();
        stmtTp.finalize();
        console.log("Database seeded with recent data for:", today, "and", yesterday);
    });

    db.close();
};

seedData();
