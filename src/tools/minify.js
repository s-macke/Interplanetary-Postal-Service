var compressor = require('node-minify');

compressor.minify({
  compressor: 'butternut',
  input: '../gameJS/game.js',
  output: 'game.js',
  callback: function(err, min) {console.log(err);},
  options: {
      sourceMap: true
  }
});

compressor.minify({
    compressor: 'butternut',
    input: '../gameJS/level.js',
    output: 'level.js',
    callback: function(err, min) {console.log(err);},
    options: {
        sourceMap: true
    }
  });

compressor.minify({
    compressor: 'butternut',
    input: '../gameJS/audio.js',
    output: 'audio.js',
    callback: function(err, min) {console.log(err);},
    options: {
        sourceMap: true
    }
  });
  

compressor.minify({
  compressor: 'html-minifier',
  input: '../gameJS/index.html',
  output: 'index.html',
  callback: function(err, min) {console.log(err);}
});
