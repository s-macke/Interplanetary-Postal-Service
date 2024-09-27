all: bin/game.wasm

SOURCES = $(wildcard src/wasm/*.c)

# -msimd128 -Rpass=loop-vectorize -Rpass-missed=loop-vectorize -Rpass-analysis=loop-vectorize
bin/game.wasm: $(SOURCES)
	clang -Ofast -nostdlib --target=wasm32 \
	-o bin/game.wasm                       \
	-Wl,--no-entry                         \
	-Wl,--gc-sections                      \
	-Wl,--strip-all                        \
	-Wl,--import-memory                    \
	$(SOURCES) -o bin/game.wasm

.PHONY: clean
clean:
	rm -f bin/game.wasm