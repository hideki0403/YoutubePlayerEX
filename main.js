const electron = require('electron')
const commander = require('commander')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const shell = electron.shell
const Tray = electron.Tray
const Menu = electron.Menu
const ipcMain = electron.ipcMain
const windowStateKeeper = require('electron-window-state')

commander.option('--enable-devtools')
commander.parse(process.argv)
const options = commander.opts()

let mainWindow = null

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

if (!app.requestSingleInstanceLock()) {
  app.exit()
} else {
  app.on('second-instance', (e, c, w) => {
    mainWindow.show()
  })

  app.on('ready', function() {

    const state = windowStateKeeper({
      defaultWidth: 640,
      defaultHeight: 360
    })

    mainWindow = new BrowserWindow({
      x: state.x,
      y: state.y,
      width: state.width,
      height: state.height,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      icon: __dirname + '/src/ytex.ico'
    })

    mainWindow.loadURL('file://' + __dirname + '/src/index.html')

    // DevToolsがonだと透過できません！！！
    if(options.enableDevtools) {
      console.log('[Debug] EnableDevTools')
      mainWindow.openDevTools()
    }

    const trayIcon = new Tray(__dirname + '/src/ytex.ico')
    var contextMenu = Menu.buildFromTemplate([
      { label: 'ウィンドウを表示', click: function() {mainWindow.show()} },
      { type: 'separator' },
      { label: '一時停止/再生', click: function() {} },
      { label: '停止', click: function() {} },
      { label: '次へ', click: function() {} },
      { label: '戻る', click: function() {} },
      { type: 'separator' },
      { label: '再起動', click: function() {app.relaunch(); app.exit()} },
      { label: '終了', click: function() {app.exit()} }
    ])
    trayIcon.setContextMenu(contextMenu)
    trayIcon.setToolTip('YoutubePlayerEX v' + app.getVersion())

    mainWindow.setThumbarButtons([
      {
        tooltip: '戻る',
        icon: __dirname + '/src/icons/previous.png',
        flags: ['nobackground'],
        click () {}
      },
      {
        tooltip: '再生/一時停止',
        icon: __dirname + '/src/icons/play-pause.png',
        flags: ['nobackground'],
        click () {}
      },
      {
        tooltip: '停止',
        icon: __dirname + '/src/icons/stop.png',
        flags: ['nobackground'],
        click () {}
      },
      {
        tooltip: '次へ',
        icon: __dirname + '/src/icons/next.png',
        flags: ['nobackground'],
        click () {}
      }
    ])

    trayIcon.on('click', function () {
      if(mainWindow.isVisible()) {
        mainWindow.close()
      } else {
        mainWindow.show()
      }
    })

    mainWindow.on('close', (event) => {
      event.preventDefault()
      mainWindow.hide()
    })

    mainWindow.webContents.on('new-window', (ev,url)=> {
      shell.openExternal(url)
    })

    ipcMain.on('close', () => {
      mainWindow.close()
    })

    state.manage(mainWindow)

  })
}