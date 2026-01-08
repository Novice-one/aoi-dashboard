const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

class DatabaseManager {
    constructor() {
        this.connections = new Map();
        this.configs = [
            {
                name: 'Front 3 Cam 2',
                host: '100.65.164.69',
                port: 3306,
                user: 'root',
                password: '123456',
                database: 'test',
                camera_filter: 2
            },
            {
                name: 'Front 3 Cam 1',
                host: '100.84.42.93',
                port: 3306,
                user: 'root',
                password: '123456',
                database: 'test',
                camera_filter: 1
            },
            {
                name: 'Front 1 Cam 1',
                host: '100.101.250.16',
                port: 3306,
                user: 'root',
                password: '123456',
                database: 'test',
                camera_filter: 1
            },
            {
                name: 'Front 1 Cam 2',
                host: '100.107.208.109',
                port: 3306,
                user: 'root',
                password: '123456',
                database: 'test',
                camera_filter: 2
            },
            {
                name: 'Front 2 Cam 1',
                host: '100.73.76.78',
                port: 3306,
                user: 'root',
                password: '123456',
                database: 'test',
                camera_filter: 1
            },
            {
                name: 'Front 2 Cam 2',
                host: '100.75.58.3',
                port: 3306,
                user: 'root',
                password: '123456',
                database: 'test',
                camera_filter: 2
            },
            {
                name: 'Rear 3 Cam 1',
                host: '100.126.200.60',
                port: 3306,
                user: 'root',
                password: '123456',
                database: 'test',
                camera_filter: 1
            },
            {
                name: 'Rear 3 Cam 2',
                host: '100.76.146.103',
                port: 3306,
                user: 'root',
                password: '123456',
                database: 'test',
                camera_filter: 2
            },
            {
                name: 'Rear 2 Cam 1',
                host: '100.105.49.127',
                port: 3306,
                user: 'root',
                password: '123456',
                database: 'test',
                camera_filter: 1
            },
            {
                name: 'Rear 2 Cam 2',
                host: '100.85.143.59',
                port: 3306,
                user: 'root',
                password: '123456',
                database: 'test',
                camera_filter: 2
            }
        ];

        const dbPath = path.join(__dirname, '../master.db');
        console.log("Local DB Path:", dbPath);

        try {
            const fs = require('fs');
            fs.writeFileSync(path.join(__dirname, '../db_location.txt'), dbPath);
        } catch (e) { console.error(e); }

        this.localDB = new sqlite3.Database(dbPath);
        this.initLocalDB();
    }

    initLocalDB() {
        this.localDB.serialize(() => {
            this.localDB.run("PRAGMA journal_mode = WAL");
            this.localDB.run("PRAGMA synchronous = NORMAL");

            this.localDB.run(`
                CREATE TABLE IF NOT EXISTS records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source_id INTEGER,
                    source_camera_id TEXT,
                    camera_id TEXT,
                    ng_type TEXT,
                    wafer_id TEXT,
                    created_at TEXT,
                    UNIQUE(source_camera_id, source_id)
                )
            `);

            this.localDB.run(`
                CREATE TABLE IF NOT EXISTS throughput (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source_host TEXT,
                    camera_id TEXT,
                    date TEXT,
                    hour INTEGER,
                    total_count INTEGER,
                    UNIQUE(source_host, camera_id, date, hour)
                )
            `);

            this.localDB.run("CREATE INDEX IF NOT EXISTS idx_created_at ON records(created_at)");
            this.localDB.run("CREATE INDEX IF NOT EXISTS idx_camera_id ON records(camera_id)");
            this.localDB.run("CREATE INDEX IF NOT EXISTS idx_ng_type ON records(ng_type)");
            this.localDB.run("CREATE INDEX IF NOT EXISTS idx_tp_lookup ON throughput(source_host, camera_id, date)");
        });
    }

    async connectAll() {
        const results = [];
        for (const config of this.configs) {
            if (this.connections.has(config.host)) continue;
            try {
                const conn = await mysql.createConnection({
                    host: config.host,
                    port: config.port,
                    user: config.user,
                    password: config.password,
                    database: config.database
                });
                this.connections.set(config.host, conn);
                results.push({ host: config.host, status: 'connected' });
                console.log(`Connected to remote host: ${config.host} (${config.name})`);
            } catch (error) {
                console.error(`Failed to connect to ${config.host} (${config.name}):`, error.message);
                results.push({ host: config.host, status: 'error', error: error.message });
            }
        }
        return results;
    }

    async sync() {
        console.log("Starting Sync...");
        await this.connectAll();

        for (const [host, conn] of this.connections) {
            try {
                const debugDate = '20240101';

                // 1. Sync NG Records
                console.log(`[SYNC] Fetching records from ${host}...`);
                const [rows] = await conn.execute(
                    `SELECT No, LineType, DefectName, Date, Time, waferid FROM record WHERE Date >= ? ORDER BY No ASC`,
                    [debugDate]
                );

                if (rows.length > 0) {
                    await new Promise((resolve, reject) => {
                        this.localDB.serialize(() => {
                            this.localDB.run("BEGIN TRANSACTION");
                            const stmt = this.localDB.prepare(`
                                INSERT OR IGNORE INTO records (source_id, source_camera_id, camera_id, ng_type, wafer_id, created_at)
                                VALUES (?, ?, ?, ?, ?, ?)
                            `);
                            rows.forEach(row => {
                                const d = row.Date;
                                const t = row.Time;
                                if (!d || !t) return;
                                const year = d.substring(0, 4);
                                const month = d.substring(4, 6);
                                const day = d.substring(6, 8);
                                const normalizedTime = t.replace(/:(\d{3})$/, '.$1');
                                const isoDate = `${year}-${month}-${day}T${normalizedTime}`;
                                stmt.run(row.No, host, row.LineType, row.DefectName, row.waferid, isoDate);
                            });
                            stmt.finalize();
                            this.localDB.run("COMMIT", err => err ? reject(err) : resolve());
                        });
                    });
                    console.log(`[SYNC] Host ${host}: NG records synced`);
                }

                // 2. Sync Throughput (Aggregated)
                console.log(`[SYNC] Fetching productivity from ${host}...`);
                const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                // Fetch last 10 days to ensure trend is populated
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 10);
                const syncStartDate = startDate.toISOString().slice(0, 10).replace(/-/g, '');

                const [tpRows] = await conn.execute(
                    `SELECT Date, SUBSTRING(Time, 1, 2) as Hour, LineType, count(*) as cnt 
                     FROM totalrecord WHERE Date >= ? GROUP BY Date, Hour, LineType`,
                    [syncStartDate]
                );

                if (tpRows.length > 0) {
                    await new Promise((resolve, reject) => {
                        this.localDB.serialize(() => {
                            this.localDB.run("BEGIN TRANSACTION");
                            const stmtTp = this.localDB.prepare(`
                                INSERT OR REPLACE INTO throughput (source_host, camera_id, date, hour, total_count)
                                VALUES (?, ?, ?, ?, ?)
                            `);
                            tpRows.forEach(row => {
                                const d = row.Date;
                                const isoDate = `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
                                stmtTp.run(host, row.LineType, isoDate, parseInt(row.Hour), row.cnt);
                            });
                            stmtTp.finalize();
                            this.localDB.run("COMMIT", err => err ? reject(err) : resolve());
                        });
                    });
                    console.log(`[SYNC] Host ${host}: Productivity synced`);
                }
            } catch (err) {
                console.error(`[SYNC] Error for ${host}:`, err.message);
            }
        }
    }

    getShiftData(filter = { type: 'all' }) {
        return new Promise(async (resolve, reject) => {
            try {
                // 1. Fetch NG Records
                let recordSql = `SELECT * FROM records`;
                let params = [];
                let where = [];

                if (filter.date) {
                    if (filter.shift === 'Shift A') {
                        where.push(`created_at >= ? AND created_at < ?`);
                        params.push(`${filter.date}T06:00:00`, `${filter.date}T14:00:00`);
                    } else if (filter.shift === 'Shift B') {
                        where.push(`created_at >= ? AND created_at < ?`);
                        params.push(`${filter.date}T14:00:00`, `${filter.date}T22:00:00`);
                    } else if (filter.shift === 'Shift C') {
                        const d = new Date(filter.date); d.setDate(d.getDate() + 1);
                        const next = d.toISOString().slice(0, 10);
                        where.push(`created_at >= ? AND created_at < ?`);
                        params.push(`${filter.date}T22:00:00`, `${next}T06:00:00`);
                    } else {
                        where.push(`date(created_at) = ?`);
                        params.push(filter.date);
                    }
                } else {
                    where.push(`datetime(created_at) >= datetime('now', '-1 day')`);
                }

                if (where.length > 0) recordSql += ` WHERE ` + where.join(' AND ');
                recordSql += ` ORDER BY created_at DESC`;

                const rows = await new Promise((res, rej) => {
                    this.localDB.all(recordSql, params, (err, data) => err ? rej(err) : res(data));
                });

                // 2. Fetch Throughput
                let tpSql = `SELECT * FROM throughput`;
                let tpParams = [];
                let tpWhere = [];

                if (filter.date) {
                    tpWhere.push(`date = ?`);
                    tpParams.push(filter.date);

                    if (filter.shift === 'Shift A') {
                        tpWhere.push(`hour >= 6 AND hour < 14`);
                    } else if (filter.shift === 'Shift B') {
                        tpWhere.push(`hour >= 14 AND hour < 22`);
                    } else if (filter.shift === 'Shift C') {
                        // Complex for C wrap-on, but let's keep it simple for now (22-23)
                        // In reality, Shift C involves next day too. 
                        // For now, we filter by date and hours 22, 23, 0-5.
                        tpWhere.push(`(hour >= 22 OR hour < 6)`);
                    }
                }

                if (tpWhere.length > 0) tpSql += ` WHERE ` + tpWhere.join(' AND ');

                const tpData = await new Promise((res, rej) => {
                    this.localDB.all(tpSql, tpParams, (err, data) => err ? rej(err) : res(data));
                });

                // Filter logic (Machine/Camera)
                let filteredRows = rows;
                let filteredTp = tpData;

                if (filter.type === 'machine' && filter.name) {
                    const prefix = filter.name.includes('Front ') ? 'F' + filter.name.split(' ')[1] : 'R' + filter.name.split(' ')[1];
                    filteredRows = rows.filter(r => r.camera_id?.startsWith(prefix));
                    filteredTp = tpData.filter(t => t.camera_id?.startsWith(prefix));
                } else if (filter.type === 'front' || (filter.type === 'analysis' && filter.area === 'front')) {
                    filteredRows = rows.filter(r => r.camera_id?.startsWith('F'));
                    filteredTp = tpData.filter(t => t.camera_id?.startsWith('F'));
                } else if (filter.type === 'rear' || (filter.type === 'analysis' && filter.area === 'rear')) {
                    filteredRows = rows.filter(r => r.camera_id?.startsWith('R'));
                    filteredTp = tpData.filter(t => t.camera_id?.startsWith('R'));
                } else if (filter.type === 'camera' && filter.name) {
                    const parts = filter.name.split(' ');
                    const id = `${parts[0][0]}${parts[1]}${parts[parts.length - 1]}`;
                    filteredRows = rows.filter(r => r.camera_id === id);
                    filteredTp = tpData.filter(t => t.camera_id === id);
                }

                // Aggregate
                const stats = {
                    shifts: { 'Shift A': 0, 'Shift B': 0, 'Shift C': 0 },
                    defects: {},
                    hourly: {},
                    hourlyDefects: {},
                    total: filteredRows.length,
                    totalInput: filteredTp.reduce((sum, t) => sum + t.total_count, 0),
                    recent: filteredRows.slice(0, 50),
                    trend: []
                };

                // Add 7-day trend for throughput (with filtering)
                const trendData = await new Promise((res, rej) => {
                    let trendSql = `
                        SELECT date, sum(total_count) as total 
                        FROM throughput 
                        WHERE date >= date('now', '-7 days')
                    `;
                    let trendParams = [];

                    if (filter.type === 'machine' && filter.name) {
                        const prefix = filter.name.includes('Front ') ? 'F' + filter.name.split(' ')[1] : 'R' + filter.name.split(' ')[1];
                        trendSql += ` AND camera_id LIKE ?`;
                        trendParams.push(`${prefix}%`);
                    } else if (filter.type === 'front') {
                        trendSql += ` AND camera_id LIKE 'F%'`;
                    } else if (filter.type === 'rear') {
                        trendSql += ` AND camera_id LIKE 'R%'`;
                    } else if (filter.type === 'camera' && filter.name) {
                        const parts = filter.name.split(' ');
                        const id = `${parts[0][0]}${parts[1]}${parts[parts.length - 1]}`;
                        trendSql += ` AND camera_id = ?`;
                        trendParams.push(id);
                    }

                    trendSql += ` GROUP BY date ORDER BY date ASC`;

                    this.localDB.all(trendSql, trendParams, (err, data) => err ? rej(err) : res(data));
                });
                stats.trend = trendData;

                filteredRows.forEach(row => {
                    const d = new Date(row.created_at);
                    const h = d.getHours();
                    let shift = 'Shift C';
                    if (h >= 6 && h < 14) shift = 'Shift A';
                    else if (h >= 14 && h < 22) shift = 'Shift B';
                    stats.shifts[shift]++;
                    stats.hourly[h] = (stats.hourly[h] || 0) + 1;
                    const type = row.ng_type || 'Unknown';
                    stats.defects[type] = (stats.defects[type] || 0) + 1;
                    if (!stats.hourlyDefects[h]) stats.hourlyDefects[h] = {};
                    stats.hourlyDefects[h][type] = (stats.hourlyDefects[h][type] || 0) + 1;
                });

                stats.yield = stats.totalInput > 0 ? (((stats.totalInput - stats.total) / stats.totalInput) * 100).toFixed(2) : "100.00";

                // DPPM = (NG / Total) * 1M
                stats.dppm = stats.totalInput > 0 ? Math.round((stats.total / stats.totalInput) * 1000000) : 0;

                resolve(stats);
            } catch (err) {
                reject(err);
            }
        });
    }

    getComparisonData(area = 'front', date = null) {
        return new Promise(async (resolve, reject) => {
            try {
                const searchDate = date || new Date().toISOString().slice(0, 10);
                const prefix = area === 'front' ? 'F' : 'R';

                // 1. Get Throughput per Machine (F1, F2, etc.)
                const tpData = await new Promise((res, rej) => {
                    this.localDB.all(`
                        SELECT SUBSTRING(camera_id, 1, 2) as machine, sum(total_count) as total_input
                        FROM throughput
                        WHERE date = ? AND camera_id LIKE ?
                        GROUP BY machine
                    `, [searchDate, `${prefix}%`], (err, data) => err ? rej(err) : res(data));
                });

                // 2. Get NG Counts per Machine
                const ngData = await new Promise((res, rej) => {
                    this.localDB.all(`
                        SELECT SUBSTRING(camera_id, 1, 2) as machine, count(*) as ng_count
                        FROM records
                        WHERE date(created_at) = ? AND camera_id LIKE ?
                        GROUP BY machine
                    `, [searchDate, `${prefix}%`], (err, data) => err ? rej(err) : res(data));
                });

                // 3. Merge
                const comparison = {};
                const machineNames = area === 'front' ? ['F1', 'F2', 'F3', 'F4'] : ['R1', 'R2', 'R3', 'R4'];

                machineNames.forEach(m => {
                    const tp = tpData.find(t => t.machine === m)?.total_input || 0;
                    const ng = ngData.find(n => n.machine === m)?.ng_count || 0;
                    const yieldVal = tp > 0 ? (((tp - ng) / tp) * 100).toFixed(2) : "100.00";
                    const dppm = tp > 0 ? Math.round((ng / tp) * 1000000) : 0;

                    comparison[m] = {
                        name: (area === 'front' ? 'Front ' : 'Rear ') + m.substring(1),
                        input: tp,
                        ng: ng,
                        yield: yieldVal,
                        dppm: dppm,
                        status: tp > 0 ? (yieldVal < 98 ? 'Warning' : 'Healthy') : 'No Data'
                    };
                });

                resolve(comparison);
            } catch (err) {
                reject(err);
            }
        });
    }

    getHeatmapData(area = 'front', date = null) {
        return new Promise(async (resolve, reject) => {
            try {
                const searchDate = date || new Date().toISOString().slice(0, 10);
                const prefix = area === 'front' ? 'F' : 'R';

                // Aggregate counts per machine AND defect type
                const results = await new Promise((res, rej) => {
                    this.localDB.all(`
                        SELECT 
                            SUBSTRING(camera_id, 1, 2) as machine,
                            ng_type as defect,
                            count(*) as count
                        FROM records
                        WHERE date(created_at) = ? AND camera_id LIKE ?
                        GROUP BY machine, defect
                    `, [searchDate, `${prefix}%`], (err, data) => err ? rej(err) : res(data));
                });

                // Format into a matrix-like object for the frontend
                // { Machines: ['F1', ...], Defects: ['D1', ...], Matrix: { 'F1': { 'D1': 5, ... }, ... } }
                const machines = area === 'front' ? ['F1', 'F2', 'F3', 'F4'] : ['R1', 'R2', 'R3', 'R4'];
                const defects = [...new Set(results.map(r => r.defect))];
                const matrix = {};

                machines.forEach(m => {
                    matrix[m] = {};
                    defects.forEach(d => {
                        const match = results.find(r => r.machine === m && r.defect === d);
                        matrix[m][d] = match ? match.count : 0;
                    });
                });

                resolve({ machines, defects, matrix });
            } catch (err) {
                reject(err);
            }
        });
    }

    closeAll() {
        for (const conn of this.connections.values()) conn.end();
        this.connections.clear();
        this.localDB.close();
    }
}

module.exports = new DatabaseManager();
