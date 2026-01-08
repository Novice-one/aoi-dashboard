const mysql = require('mysql2/promise');
const fs = require('fs');

async function check() {
    try {
        const conn = await mysql.createConnection({
            host: '100.65.164.69',
            port: 3306,
            user: 'root',
            password: '123456',
            database: 'test'
        });

        const [cols] = await conn.execute('DESCRIBE record');
        const colNames = cols.map(r => r.Field).join(', ');

        const [rows] = await conn.execute('SELECT * FROM record ORDER BY No DESC LIMIT 1');

        const dump = `COLUMNS:\n${colNames}\n\nSAMPLE ROW:\n${JSON.stringify(rows[0], null, 2)}`;
        fs.writeFileSync('schema_dump.txt', dump);
        console.log("Dumped to schema_dump.txt");

        conn.end();
    } catch (e) {
        console.error(e);
    }
}
check();
