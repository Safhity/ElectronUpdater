const { app, BrowserWindow,dialog } = require('electron');
const os = require('os');
const path = require('path');
const { download } = require('electron-dl');
const axios= require('axios');


const windowStateKeeper = require('electron-window-state');

let mainWindow;

function createWindow() {
  let windowState = windowStateKeeper({
    defaultWidth: 1200,
    defaultHeight: 800,
  });
  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    autoHideMenuBar: true,
    icon: __dirname + '/icon.png',
    parent: mainWindow,
    show: false,
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      enableRemoteModule: false,
      contextIsolation: true,
      webviewTag: false,
      webSecurity: true,
      devTools: true

    },
  });


  mainWindow.loadURL('http://64.176.166.24:3001/', {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36'
  });
  mainWindow.maximize();
  mainWindow.once('ready-to-show', () => {
    mainWindow.show() // show the window once it is ready
  })

  mainWindow.on('closed', () => (mainWindow = null));

  windowState.manage(mainWindow);

}
app.whenReady().then(async () => {
  createWindow();
  try {
    const response = await axios.get('https://api.github.com/repos/Safhity/ElectronUpdater/releases/latest');
    const comparison = compareVersions(response.data.tag_name, app.getVersion())
    console.log(response.data.tag_name)
    console.log(app.getVersion())
    if (comparison > 0) {
      const dialogResponse = await dialog.showMessageBox({
        type: 'info',
        message: 'Update available',
        detail: 'A new version of the app is available. Do you want to download and install it?',
        buttons: ['Yes', 'No'],
      });
      if (dialogResponse.response === 0) {
        const win = BrowserWindow.getFocusedWindow();
        const appExecutablePath = process.execPath;
        const appDirectory = path.dirname(appExecutablePath);
        console.log(appDirectory);
        const downloadOptions = {
          directory: path.join(os.homedir(), 'Downloads'),
          showBadge: true,
          onProgress: (progress) => {
            console.log(`Download progress: ${progress.percent}%`);
          }
        };
        const downloadUrl = response.data.assets[0].browser_download_url;

        const downloadItem = await download(win, downloadUrl, downloadOptions);
        const filePath = downloadItem.getSavePath();


        app.quit();
        app.relaunch({ execPath: filePath });
      }
    }

  } catch (error) {
    console.error('Error checking for updates:', error);
  }
});

//compareVersions 
function compareVersions(version1, version2) {
  const v1 = version1.split('.');
  const v2 = version2.split('.');
  
  for (let i = 1; i < Math.max(v1.length, v2.length); i++) {
    const num1 = parseInt(v1[i]) || 0;
    const num2 = parseInt(v2[i]) || 0;
    
    if (num1 < num2) {
      return -1;
    } else if (num1 > num2) {
      return 1;
    }
  }
  
  return 0;
}





app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});


