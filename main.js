const {app, BrowserWindow, Menu} = require('electron')
const path = require('path')
const url = require('url')
const log = require('electron-log')
const {autoUpdater} = require("electron-updater")
const isDev = require('electron-is-dev')

autoUpdater.logger = log
autoUpdater.logger.transports.file.level = 'info'
log.info('App starting...')

// Menu
// noch nix

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 1024, height: 768, minWidth: 1024, maxWidth: 1024, minHeight: 300, center: true, resizable: true, frame: true, show: false, backgroundColor: '#fff', selectedTextBackgroundColor: '#ff0', title: 'pflege.de Raumplan'})

  win.once('ready-to-show', () => {
    win.show()
  })

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

function sendStatus(text) {
  log.info(text);
  win.webContents.send('message', text);
}

if(!isDev){
  //-------------------------------------------------------------------
  // Auto updates
  //
  // For details about these events, see the Wiki:
  // https://github.com/electron-userland/electron-builder/wiki/Auto-Update#events
  //-------------------------------------------------------------------
  autoUpdater.on('checking-for-update', () => {
    sendStatus('Checking for update...');
    alert('Checking for update...');
  })
  autoUpdater.on('update-available', (ev, info) => {
    sendStatus('Update available.');
    alert('Update available.');
  })
  autoUpdater.on('update-not-available', (ev, info) => {
    sendStatus('Update not available.');
    alert('Update not available.');
  })
  autoUpdater.on('error', (ev, err) => {
    sendStatus('Error in auto-updater.');
    alert('Error in auto-updater.');
  })
  autoUpdater.on('download-progress', (ev, progressObj) => {
    sendStatus('Download progress...');
    alert('Download progress... '+progressObj);
    log.info('progressObj', progressObj);
  })
  autoUpdater.on('update-downloaded', (ev, info) => {
    sendStatus('Update downloaded.  Will quit and install in 5 seconds.');
    alert('Update downloaded.  Will quit and install in 5 seconds.');
    // Wait 5 seconds, then quit and install
    setTimeout(function() {
      autoUpdater.quitAndInstall();  
    }, 5000)
  })
  // Wait a second for the window to exist before checking for updates.
  setTimeout(function() {
    autoUpdater.checkForUpdates()  
  }, 1000)
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here