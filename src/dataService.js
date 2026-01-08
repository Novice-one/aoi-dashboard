const getCachedData = async () => {
    if (cachedData) return cachedData;
    try {
        console.log("Loading AOI Data Snapshot...");
        // Add cache buster to ensure fresh data
        const response = await fetch('./data.json?cb=' + Date.now());
        if (!response.ok) throw new Error('Failed to load data.json');
        cachedData = await response.json();
        console.log("Data loaded successfully:", cachedData.records?.length, "records");
        return cachedData;
    } catch (err) {
        console.error("CRITICAL: Data Snapshop Load Failed:", err);
        return { records: [], throughput: [] };
    }
};

export const fetchDashboardData = async (filter, selectedDate, selectedShift) => {
    // If running in Electron
    if (window.electronAPI && window.electronAPI.getDashboardData) {
        return await window.electronAPI.getDashboardData({ ...filter, date: selectedDate, shift: selectedShift });
    }

    // Browser Mode
    try {
        const allData = await getCachedData();
        const records = allData.records || [];
        const throughput = allData.throughput || [];

        // Determine which date to use (Today or fallback to latest available)
        let finalDate = selectedDate;
        const availableDates = [...new Set(records.map(r => r.created_at.slice(0, 10)))].sort();

        if (!records.some(r => r.created_at.startsWith(selectedDate))) {
            console.warn(`No data for ${selectedDate}, falling back to latest available: ${availableDates[availableDates.length - 1]}`);
            finalDate = availableDates[availableDates.length - 1];
        }

        let filteredRows = records;
        let filteredTp = throughput;

        if (finalDate) {
            filteredRows = records.filter(r => r.created_at.startsWith(finalDate));
            filteredTp = throughput.filter(t => t.date === finalDate);
        }

        // Apply shift filter (simple approximation)
        if (selectedShift && selectedShift !== 'All') {
            const shiftHours = {
                'Shift A': [6, 7, 8, 9, 10, 11, 12, 13],
                'Shift B': [14, 15, 16, 17, 18, 19, 20, 21],
                'Shift C': [22, 23, 0, 1, 2, 3, 4, 5]
            };
            const hours = shiftHours[selectedShift];
            filteredRows = filteredRows.filter(r => {
                const hour = new Date(r.created_at).getHours();
                return hours.includes(hour);
            });
            filteredTp = filteredTp.filter(t => hours.includes(t.hour));
        }

        // Apply side/machine/camera filter
        if (filter.type === 'machine' && filter.name) {
            const prefix = filter.name.includes('Front ') ? 'F' + filter.name.split(' ')[1] : 'R' + filter.name.split(' ')[1];
            filteredRows = filteredRows.filter(r => r.camera_id?.startsWith(prefix));
            filteredTp = filteredTp.filter(t => t.camera_id?.startsWith(prefix));
        } else if (filter.type === 'front' || (filter.type === 'analysis' && filter.area === 'front')) {
            filteredRows = filteredRows.filter(r => r.camera_id?.startsWith('F'));
            filteredTp = filteredTp.filter(t => t.camera_id?.startsWith('F'));
        } else if (filter.type === 'rear' || (filter.type === 'analysis' && filter.area === 'rear')) {
            filteredRows = filteredRows.filter(r => r.camera_id?.startsWith('R'));
            filteredTp = filteredTp.filter(t => t.camera_id?.startsWith('R'));
        }

        // Aggregate for stats
        const stats = {
            shifts: { 'Shift A': 0, 'Shift B': 0, 'Shift C': 0 },
            defects: {},
            hourly: {},
            hourlyDefects: {},
            total: filteredRows.length,
            totalInput: filteredTp.reduce((sum, t) => sum + t.total_count, 0),
            recent: filteredRows.slice(0, 50),
            trend: [] // Trend might need more logic
        };

        // Simplified 7-day trend
        const dailyTp = {};
        throughput.forEach(t => {
            dailyTp[t.date] = (dailyTp[t.date] || 0) + t.total_count;
        });
        stats.trend = Object.keys(dailyTp).sort().map(date => ({ date, total: dailyTp[date] }));

        filteredRows.forEach(row => {
            const h = new Date(row.created_at).getHours();
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
        return stats;
    } catch (err) {
        console.error("Static data fetch failed:", err);
        return { error: "Failed to fetch static data" };
    }
};

export const fetchComparisonData = async (area, date) => {
    if (window.electronAPI && window.electronAPI.getComparisonData) {
        return await window.electronAPI.getComparisonData(area, date);
    }
    // Static fallback for comparison
    const { records } = await getCachedData();
    // Simplified comparison logic
    return { records: records.slice(0, 100) }; // Placeholder
};

export const fetchHeatmapData = async (area, date) => {
    if (window.electronAPI && window.electronAPI.getHeatmapData) {
        return await window.electronAPI.getHeatmapData(area, date);
    }
    // Static fallback for heatmap
    const { records } = await getCachedData();
    return { machines: [], defects: [], matrix: {}, records: records.slice(0, 500) };
};
