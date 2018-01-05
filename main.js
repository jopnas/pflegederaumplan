const {app, BrowserWindow, Menu} = require('electron')
const path = require('path')
const url = require('url')
const {ProgId, ShellOption, Regedit} = require('electron-regedit')

new ProgId({
   description: 'pflege.de Raumplan',
   icon: 'pflegefile.ico',
   extensions: ['pflegede'],
   shell: [
       new ShellOption({verb: ShellOption.OPEN, action: 'Mit pflege.de Raumplan öffnen', icon: 'pflegefile.ico'}),
       //new ShellOption({verb: ShellOption.EDIT, args: ['--edit']}),
       //new ShellOption({verb: ShellOption.PRINT, args: ['--print']})
   ]
})

Regedit.installAll()

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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here