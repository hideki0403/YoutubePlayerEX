const electron = require('electron')
const commander = require('commander')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const shell = electron.shell

commander.option('--enable-devtools')
commander.parse(process.argv)
const options = commander.opts()

let mainWindow = null

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('ready', function() {

  mainWindow = new BrowserWindow({
    width: 640,
    height: 360,
    transparent: true,
    frame: false,
    alwaysOnTop: true
  })

  mainWindow.loadURL('file://' + __dirname + '/src/index.html')

  // DevToolsがonだと透過できません！！！
  if(options.enableDevtools) {
    console.log('[Debug] EnableDevTools')
    mainWindow.openDevTools()
  }

  mainWindow.on('closed', function() {
    mainWindow = null
  })

  mainWindow.webContents.on('new-window', (ev,url)=> {
    shell.openExternal(url)
  })

})