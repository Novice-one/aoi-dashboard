const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Force dev mode loading for this test phase
  const startUrl = 'http://localhost:5173';
  mainWindow.loadURL(startUrl);
  // mainWindow.webContents.openDevTools();
}

const dbManager = require('./database.cjs');

app.whenReady().then(async () => {
  try {
    console.log("Connecting to database...");
    await dbManager.connectAll();
    console.log("Database connected. Creating window...");
    createWindow();

    // Initial Sync
    dbManager.sync();
    // Periodic Sync every 5 mins
    setInterval(() => dbManager.sync(), 300000);

  } catch (err) {
    console.error("Startup Error:", err);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  dbManager.closeAll();
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('get-dashboard-data', async (event, filter) => {
  try {
    const data = await dbManager.getShiftData(filter);
    return data;
  } catch (error) {
    console.error("IPC Error:", error);
    return { error: error.message };
  }
});

ipcMain.handle('get-comparison-data', async (event, area, date) => {
  try {
    return await dbManager.getComparisonData(area, date);
  } catch (error) {
    console.error("Comparison IPC Error:", error);
    return { error: error.message };
  }
});

ipcMain.handle('get-heatmap-data', async (event, area, date) => {
  try {
    return await dbManager.getHeatmapData(area, date);
  } catch (error) {
    console.error("Heatmap IPC Error:", error);
    return { error: error.message };
  }
});

ipcMain.handle('manual-sync', async () => {
  try {
    console.log("Manual sync requested...");
    await dbManager.sync();
    return { success: true };
  } catch (error) {
    console.error("Manual Sync Error:", error);
    return { error: error.message };
  }
});

