#!/bin/bash

set -e

# Generate compressed maps
mkdir -p bin
gcc src/maps/compress.c -o bin/compress
./bin/compress > src/wasm/maps.h

# Generate wasm file
make clean
make

wasm-dis bin/game.wasm  | grep '(export\|(import\|(global \$'

ls -la bin/game.wasm

# copy JS file into bin directory.
# The game can be tested in this directory
cp src/js/* bin/

exit 1

# minify
mkdir -p minify
cd minify
cp ../src/tools/minify.js .
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
zip Interplanetary_Postal_Lander.zip compile.sh src/*

