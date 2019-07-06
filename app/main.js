const electron = require('electron')
const commander = require('commander')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const shell = electron.shell
const Tray = electron.Tray
const Menu = electron.Menu
const ipcMain = electron.ipcMain
const windowStateKeeper = require('electron-window-state')
const request = require('request')
const version = app.getVersion()
const dialog = electron.dialog
const log = require('electron-log')
require('date-utils')

process.on('uncaughtException', function(err) {
  log.error('electron:event:uncaughtException')
  log.error(err)
  log.error(err.stack + '\n')
  app.quit()
})

var URL = 'https://ytplayer-ex.herokuapp.com/api/versions'

function checkUpdate(f) {
  request.get({uri: URL,　headers: {'Content-type': 'application/json'},　json: true}, 
  function(err, req, data){
      var update = data[0]
      if(update !== undefined && version !== update.tag) {
        var date = new Date(update.published_at).toFormat("YYYY年MM月DD日 HH24時MI分SS秒")
        dialog.showMessageBox({
          title: 'YoutubePlayerEX',
          message: 'アップデートがあります (v' + update.tag + ')',
          detail: 'アップデート内容:\n' + update.notes + '\nリリース日: ' +　date + '\nチャンネル: ' + update.channel + '\n\nダウンロードするためにブラウザを開きますか？',
          buttons: ['Yes', 'No']
        }, function(response) {
          if(response === 0) {
            shell.openExternal('https://ytplayer-ex.herokuapp.com/')
          }
        })
      } else if(f === true) {
        dialog.showMessageBox({
          title: 'YoutubePlayerEX',
          message: 'アップデートはありませんでした',
          detail: 'このクライアントは最新版 (v' + version + ') です。',
          buttons: ['OK']
        })
      }
  }
)
}

if(!app.isPackaged) {
  commander.option('--enable-devtools')
  commander.parse(process.argv)
  options = commander.opts()
}

let mainWindow = null
let trayIcon = null

function control(k) {
  mainWindow.webContents.send('player-control', k)
}

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

    let mainWindowState = windowStateKeeper({
      defaultWidth: 640,
      defaultHeight: 360
    })

    mainWindow = new BrowserWindow({
      'x': mainWindowState.x,
      'y': mainWindowState.y,
      'width': mainWindowState.width,
      'height': mainWindowState.height,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      icon: __dirname + '/src/ytex.ico',
      webPreferences: {nodeIntegration: true}
    })

    mainWindow.loadURL('file://' + __dirname + '/src/index.html')

    // DevToolsがonだと透過できません！！！
    if(!app.isPackaged) {
      if(options.enableDevtools) {
        console.log('[Debug] EnableDevTools')
        mainWindow.openDevTools()
      }
    }

    trayIcon = new Tray(__dirname + '/src/ytex.ico')
    var contextMenu = Menu.buildFromTemplate([
      { label: 'ウィンドウを表示', click: function() {mainWindow.show()} },
      { type: 'separator' },
      { label: '一時停止/再生', click: function() {control('start-pause')} },
      { label: '停止', click: function() {control('stop')} },
      { label: '次へ', click: function() {control('next')} },
      { label: '戻る', click: function() {control('previous')} },
      { type: 'separator' },
      { label: '更新', click: function() {checkUpdate(true)} },
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
        click () {control('previous')}
      },
      {
        tooltip: '再生/一時停止',
        icon: __dirname + '/src/icons/play-pause.png',
        flags: ['nobackground'],
        click () {control('start-pause')}
      },
      {
        tooltip: '停止',
        icon: __dirname + '/src/icons/stop.png',
        flags: ['nobackground'],
        click () {control('stop')}
      },
      {
        tooltip: '次へ',
        icon: __dirname + '/src/icons/next.png',
        flags: ['nobackground'],
        click () {control('next')}
      }
    ])

    checkUpdate()

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

    mainWindowState.manage(mainWindow)

  })
}