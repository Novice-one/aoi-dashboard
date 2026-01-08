const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// We need to wait for app ready to be 100% sure of paths, though usually okay
app.whenReady().then(() => {
    const userData = app.getPath('userData');
    const dbPath = path.join(userData, 'master.db');
    console.log("ELECTRON USER DATA PATH:", userData);
    console.log("FULL DB PATH:", dbPath);
    console.log("EXISTS:", fs.existsSync(dbPath));
    app.quit();
});
