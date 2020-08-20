const url = require('url')
const remote = require('electron').remote
const electron = require('electron')
const Menu = remote.Menu
const MenuItem = remote.MenuItem
const clipboard = electron.clipboard
const ipcRenderer = electron.ipcRenderer
const app = electron.remote.app

/* CONSOLE MESSAGE */
console.log('\n%c開発者ツールへようこそ！\n%cYoutubePlayerEX v' + app.getVersion() + '%c\n\nもしあなたが何をしているのか分からないのであれば、%cこのウィンドウを閉じること%cを推奨します。\n分かっているのであれば、YoutubePlayerEXを作るのを手伝ってください♡ \n\n%cこのソフトのバグの報告はGithubのIssuesへお願いします。\n--> https://github.com/hideki0403/YoutubePlayerEX/issues\n%c製作者: ゆきねこ(@hideki_0403)\n--> https://twitter.com/hideki_0403\n\n', 'font-size: 30px; color: #2196F3; text-shadow:0px 0px 10px #90caf9;', 'font-size: 12px; color: #2196F3; text-shadow:0px 0px 10px #90caf9;', '', 'color: red;', '', 'color: #1976d2;', 'color: #1976d2;')

var menu = new Menu()
menu.append(new MenuItem({
    label: '貼り付け',
    accelerator: 'CmdOrCtrl+V',
    click: function() {
        $('#vurl').focus()
        setTimeout(function() {
            $('#vurl').val(clipboard.readText())
        }, 200)
    }
  }))

window.addEventListener('contextmenu', function (e) {
  e.preventDefault()
  menu.popup(remote.getCurrentWindow())
}, false)

window.onload = function(){
    var playbutton = $('#play')[0]
    playbutton.onclick = function() {
        loadVideo($('#vurl').val())
    }

    var close = $('#close-button')[0]
    close.onclick = function() {
        ipcRenderer.send('close')
    }
}

function parseVideoId(vurl) {
    // URLから動画ID等パース
    if(vurl.match(/https:\/\/youtu\.be\/*/)) {
        return {v: vurl.replace('https://youtu.be/', '')}
    } else {
        var res = url.parse(vurl, true).query
        if(Object.keys(res).length !== 0) {
            return res
        } else {
            return null
        }
    }
}

function loadVideo(vurl) {

    var obj = parseVideoId(vurl)

    if(obj !== null) {
        var options = {width: '100%', height: '100%', playerVars: {rel: 0, autoplay: 1, origin: 'file://'},events: {'onStateChange': onPlayerStateChange, 'onError': error, 'onReady': success}}

        if(obj.list !== undefined) {
            options.playerVars.listType = 'list'
            options.playerVars.list = obj.list
            if(obj.index !==undefined) {
                options.playerVars.index= obj.index - 1
            }
        } else if(obj.v !== undefined) {
            options.videoId = obj.v
        } else {
            error()
        }

        ytPlayer = new YT.Player('player', options)

    } else {
        // エラー時
        error()
    }

}

function onPlayerStateChange(event) {
    // タイトル更新
    document.title = event.target.playerInfo.videoData.title + ' - YoutubePlayerEX'
    if (event.target.getPlayerState() === YT.PlayerState.ENDED) {
        if(event.target.getPlaylist() === null || event.target.getPlaylist().length === event.target.getPlaylistIndex() + 1) {
            event.target.destroy()
            $('#menu').removeAttr('hidden')
            document.title = 'YoutubePlayerEX'
        }
    }
    ipcRenderer.send('state', event.target.playerInfo)
}

function error(event) {
    // エラー処理
    console.log('ERROR! : ' + event)
    if(event === undefined) {
        $('#error').text('エラー(1): URLが入力されていないか、URLが不正です。')
    } else {
        event.target.destroy()
        $('#menu').removeAttr('hidden')
        switch(event.data) {
            case 2:
                $('#error').text('エラー(2): リクエストに無効なパラメーターが含まれています。')
                break
            case 5:
                $('#error').text('エラー(5): リクエストしたコンテンツは HTML5 プレーヤーで再生できない、または HTML5 プレーヤーに関する別のエラーが発生しました。')
                break
            case 100:
                $('#error').text('エラー(100): リクエストした動画が見つかりません。これは、動画が何らかの理由で削除されている場合や、非公開に設定されている場合に発生します。')
                break
            case 101 || 150:
                $('#error').text('エラー(101/150): リクエストした動画の所有者が、埋め込み動画プレーヤーでの再生を許可していません。')
                break
        }
    }

    $('#success').text('')
}

function success() {
    $('#success').text('再生に成功しました')
    $('#error').text('')
    $('#menu').attr('hidden', 'dummy')
}

ipcRenderer.on('player-control', (event, arg) => {
    switch(arg) {
        case 'start-pause':
            if(ytPlayer.getPlayerState() !== 2) {
                ytPlayer.pauseVideo()
            } else {
                ytPlayer.playVideo()
            }
            break
        case 'stop':
            ytPlayer.stopVideo()
            ytPlayer.destroy()
            $('#menu').removeAttr('hidden')
            ipcRenderer.send('state', {playerState: 0})
            document.title = 'YoutubePlayerEX'
            break
        case 'next':
            ytPlayer.nextVideo()
            break
        case 'previous':
            ytPlayer.previousVideo()
            break
    }    
})

ipcRenderer.on('focus-control', (event, arg) => {
    if(arg) {
        $('#frame').css('opacity', '0.7')
    } else {
        $('#frame').css('opacity', '0')
    }
})

ipcRenderer.on('opacity-control', (event, arg) => {
    console.log(arg)
    if(!arg) {
        $('#player-outside').addClass('hover-opacity')
    } else {
        $('#player-outside').removeClass('hover-opacity')
    }
})

/*  デバッグ用  */
/*
function onYouTubeIframeAPIReady() {
    loadVideo('https://www.youtube.com/watch?v=Yva5rDeBYmY&list=PLhBFtfU8XBpYT46_5NxutQkxJXMVf_ajO&index=22&t=0s')
}
*/