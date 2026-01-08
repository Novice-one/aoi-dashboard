const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getDashboardData: (filter) => ipcRenderer.invoke('get-dashboard-data', filter),
    getComparisonData: (area, date) => ipcRenderer.invoke('get-comparison-data', area, date),
    getHeatmapData: (area, date) => ipcRenderer.invoke('get-heatmap-data', area, date),
    manualSync: () => ipcRenderer.invoke('manual-sync'),
});
