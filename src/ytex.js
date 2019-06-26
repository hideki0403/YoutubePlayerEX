const url = require('url')
const remote = require('electron').remote
const Menu = remote.Menu
const MenuItem = remote.MenuItem

var menu = new Menu()
menu.append(new MenuItem({
    label: '貼り付け',
    accelerator: 'CmdOrCtrl+V',
    role: 'paste'
  }))

window.addEventListener('contextmenu', function (e) {
  e.preventDefault()
  menu.popup(remote.getCurrentWindow())
}, false)

window.onload = function(){
    var playbutton = $('#play')[0]
    playbutton.onclick = function(){
        loadVideo($('#vurl').val())
    }
}

function parseVideoId(vurl) {
    // URLから動画ID等パース
    var res = url.parse(vurl, true).query
    if(Object.keys(res).length !== 0) {
        return res
    } else {
        return null
    }
}

function loadVideo(vurl) {

    var obj = parseVideoId(vurl)

    if(obj !== null) {
        var options = {width: '100%', height: '100%', playerVars: {rel: 0, autoplay: 1},events: {'onStateChange': onPlayerStateChange, 'onError': error, 'onReady': hiddenMenu}}

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

        success()
        ytPlayer = new YT.Player('player', options)

    } else {
        // エラー時
        error()
    }

}

function onPlayerStateChange(event) {
    // タイトル更新
    document.title = $('#player').contents().find('.ytp-title-text')[0].innerText
    if (event.target.getPlayerState() === YT.PlayerState.ENDED) {
        if(event.target.getPlaylist() === null || event.target.getPlaylist().length === event.target.getPlaylistIndex() + 1) {
            event.target.destroy()
            $('#menu').removeAttr('hidden')
            $('body').prepend('<div id="player"></div>')
        }
    }
}

function error(event) {
    // エラー処理
    console.log('ERROR!')
    if(event === undefined) {
        $('#error').text('エラー(1): URLが入力されていないか、URLが不正です。')
    } else {
        event.target.destroy()
        $('body').prepend('<div id="player"></div>')
        switch(event.data) {
            case 2:
                $('#error').text('エラー(2): リクエストに無効なパラメータ値が含まれています。')
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

function hiddenMenu() {
    $('#menu').attr('hidden', 'dummy')
}

function success() {
    $('#success').text('再生に成功しました')
    $('#error').text('')
}

/*  デバッグ用  */
function onYouTubeIframeAPIReady() {
    //loadVideo('https://www.youtube.com/watch?v=Yva5rDeBYmY&list=PLhBFtfU8XBpYT46_5NxutQkxJXMVf_ajO&index=22&t=0s')
}