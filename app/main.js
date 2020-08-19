const log = require('electron-log')
process.on('uncaughtException', function(err) {
  log.error('electron:event:uncaughtException')
  log.error(err)
  log.error(err.stack + '\n')
  app.quit()
})

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
const rpc = require('discord-rich-presence')('596887631124758538')
const Store = require('electron-store')
const config = new Store()
const timestamp = Date.now()
require('date-utils')

var URL = 'https://ytplayer-ex.herokuapp.com/api/versions'

function checkUpdate(f) {
  request.get({uri: URL,　headers: {'Content-type': 'application/json'},　json: true}, 
  function(err, req, data){
      var update = data[0]
      if(update !== undefined && version !== update.tag) {
        var date = new Date(update.published_at).toFormat('YYYY年MM月DD日 HH24時MI分SS秒')
        dialog.showMessageBox({
          title: 'YoutubePlayerEX',
          message: 'アップデートがあります (v' + update.tag + ')',
          detail: 'アップデート内容:\n' + update.notes + '\nリリース日: ' +　date + '\nチャンネル: ' + update.channel + '\n\nダウンロードするためにブラウザを開きますか？',
          buttons: ['Yes', 'No']
        }, function(response) {
          if(response === 0) {
            shell.openExternal('https://ytplayer-ex.herokuapp.com/download/0')
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

function store(item) {
  if(config.get(item) === undefined) {
    config.set(item, false)
  }
  return config.get(item)
}

function checkbox(n) {
  if(store(n)) {
    config.set(n, false)
  } else {
    config.set(n, true)
  }
}

function updateRPC(d) {
  if(!store('conf-rpc')) {
    rpc.updatePresence(d)
  }
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

    updateRPC({
      details: 'Idling',
      state: 'YoutubePlayerEX v' + app.getVersion(),
      startTimestamp: timestamp,
      largeImageKey: 'main',
      largeImageText: 'YoutubePlayerEX v' + version,
      smallImageKey: 'stop',
      smallImageText: 'Idling',
      instance: true
    })

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
      { label: '設定', submenu: [
        { label: 'Discordに詳細を表示させない', type: 'checkbox', checked: store('conf-rpc'), click: function(){ checkbox('conf-rpc') }},
        { label: '最前面に表示させない', type: 'checkbox', checked: store('conf-pip'), click: function(){ checkbox('conf-pip') }},
        { label: '透過を無効化する', type: 'checkbox', checked: store('conf-opacity'), click: function(){ checkbox('conf-opacity') }},
        { label: '開発者向け', submenu: [
          { label: 'RendererDevTools', click: function() {mainWindow.openDevTools()} },
          { label: 'Reload', click: function() {mainWindow.webContents.reload()} }
        ]}
      ]},
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

    mainWindow.webContents.on('new-window', (event, url)=> {
      event.preventDefault()
      shell.openExternal(url)
    })

    ipcMain.on('close', () => {
      mainWindow.close()
    })

    ipcMain.on('state', (event, d) => {
      arr = [0, 1, 2]
      // ここにipc関連の処理
      if(arr.includes(d.playerState)) {
        if(d.playlist !== null) {
          if(d.playerState === 0) {
            rpc_play_type = ''
          } else {
            rpc_play_type = 'playlist (' + (d.playlistIndex + 1) + '/' + (d.playlist.length) + ')'
          }
        } else {
          rpc_play_type = 'video'
        }
  
        if(d.playerState !== 0) {
          rpc_music = d.videoData.title
          rpc_author = d.videoData.author
          trayIcon.setToolTip(rpc_music + ' - YoutubePlayerEX v' + app.getVersion())
        } else {
          rpc_music = 'Idling'
          rpc_author = 'YoutubePlayerEX v' + app.getVersion()
          trayIcon.setToolTip('YoutubePlayerEX v' + app.getVersion())
        }
  
        switch(d.playerState) {
          case 1:
            rpc_s_key = 'play'
            rpc_s_text = 'Playing ' + rpc_play_type
            break
  
          case 2:
              rpc_s_key = 'pause'
              rpc_s_text = 'Pausing ' + rpc_play_type
              break
  
          case 0:
              rpc_s_key = 'stop'
              rpc_s_text = 'Idling'
              break
        }
  
        var tmp = {
          details: rpc_music,
          state: rpc_author,
          startTimestamp: timestamp,
          largeImageKey: 'main',
          largeImageText: 'YoutubePlayerEX v' + version,
          smallImageKey: rpc_s_key,
          smallImageText: rpc_s_text,
          instance: true,
        }
  
        updateRPC(tmp) 
      }
    })

    mainWindowState.manage(mainWindow)

  })
}