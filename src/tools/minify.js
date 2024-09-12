var compressor = require('node-minify');

compressor.minify({
  compressor: 'butternut',
  input: '../src/js/game.js',
  output: 'game.js',
  callback: function(err, min) {console.log(err);},
  options: {
      sourceMap: true
  }
});

compressor.minify({
    compressor: 'butternut',
    input: '../src/js/level.js',
    output: 'level.js',
    callback: function(err, min) {console.log(err);},
    options: {
        sourceMap: true
    }
  });

compressor.minify({
    compressor: 'butternut',
    input: '../src/js/audio.js',
    output: 'audio.js',
    callback: function(err, min) {console.log(err);},
    options: {
        sourceMap: true
    }
  });
  

compressor.minify({
  compressor: 'html-minifier',
  input: '../src/js/index.html',
  output: 'index.html',
  callback: function(err, min) {console.log(err);}
});
