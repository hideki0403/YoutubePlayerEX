var packager = require('electron-packager')
var src = '../app'
var config = require(src + '/package.json')

var version = config.version

packager({  
  dir: src,
  out: '../packaged/' + version,
  name: 'YoutubePlayerEX',
  platform: 'win32',
  arch: 'x64',
  icon: '../app/src/ytex.ico',

  'app-bundle-id': 'ml.hideki0403',
  'app-version': version,

  overwrite: true,
  asar: true,
  prune: true
})