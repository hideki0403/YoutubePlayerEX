var packager = require('electron-packager')
var src = '../app'
var config = require(src + '/package.json')
const builder = require('electron-builder');

var version = config.version

/*
builder.build({
    platform: 'win',
    config: {
        'directories': {
            'app': '../app',
            'output': '../packaged/' + version
        },
        'appId': 'ml.hideki0403.ytex',
        'productName': 'YoutubePlayerEX',
        'buildVersion': version,
        'win':{
            'icon': '../app/src/ytex.ico',
            'target': {
                'target': 'portable',
                'arch': ['x64']
            }
        }
    }
});
*/

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