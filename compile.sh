#!/bin/bash

set -e

# Generate compressed maps
mkdir -p bin
gcc maps/compress.c -o bin/compress
./bin/compress > gameWASM/maps.h

# Generate wasm file
emcc -Os -s TOTAL_MEMORY=16MB -o bin/game.html gameWASM/*.c

# remove obsolete files
rm bin/game.js
rm bin/game.html

# copy JS file into bin directory.
# The game can be tested in this directory
cp gameJS/* bin/

# minify
mkdir -p minify
cd minify
cp ../tools/minify.js .
npm install node-minify
node minify.js

# put all script directly into the html file
sed 's/<script src=audio.js>/<script>$x/' index.html | x="$(cat audio.js)" envsubst '$x' > 1.html
sed 's/<script src=game.js>/<script>$x/' 1.html | x="$(cat game.js)" envsubst '$x' > 2.html
sed 's/<script src=level.js>/<script>$x/' 2.html | x="$(cat level.js)" envsubst '$x' > 3.html
cp 3.html index.html

cd ..

# copy wasm file into the minify directory. 
# Now the game can be tested in the minified version
cp bin/game.wasm minify/

# compress
FILENAME=Interplanetary_Postal_Lander_minified.zip
rm -f $FILENAME

zip -j $FILENAME minify/game.wasm minify/index.html
advzip -i 100 -p -z -4 $FILENAME
zip -T $FILENAME

# show file size
stat --printf="size = %s\n" Interplanetary_Postal_Lander_minified.zip

rm -f Interplanetary_Postal_Lander.zip
zip Interplanetary_Postal_Lander.zip compile.sh gameJS/* gameWASM/* maps/* tools/*

