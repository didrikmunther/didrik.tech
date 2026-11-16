#!/bin/bash

# Rebuilds the runnable projects that open in the projects-page modal, from
# their own repositories at pinned commits, into meta/. Needs git, Emscripten
# (emcc on PATH, which also provides wasm-opt), Rust with the wasm32-wasip1 and
# wasm32-unknown-unknown targets, wasm-bindgen-cli 0.2.93, and Node.
#
#   source /path/to/emsdk/emsdk_env.sh
#   bash runnables/build.sh

set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
meta="$here/../meta"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# emsdk ships wasm-opt (binaryen) next to Emscripten but doesn't put it on PATH.
wasm_opt="$(command -v wasm-opt || echo "$(dirname "$(command -v emcc)")/../bin/wasm-opt")"

clone() { git clone -q "https://github.com/didrikmunther/$1.git" "$work/$1" && git -C "$work/$1" checkout -q "$2"; }

# Snake (2013): the game's files unchanged; CApp.cpp's blocking main renamed and
# replaced by web_main.cpp, which drives the same methods from the browser loop.
clone snakecode 28d2c27
mkdir -p "$work/stubs" && : > "$work/stubs/vld.h"   # Windows Visual Leak Detector header, unused
( cd "$work/snakecode"
  em++ -std=c++14 -w -O2 -c CApp.cpp -Dmain=snakecode_desktop_main -I"$work/stubs" -sUSE_SDL=1 -o CApp.o
  em++ -std=c++14 -w -O2 CApp_On*.cpp CBlock.cpp CRect.cpp CSnake.cpp CApp.o "$here/snake/web_main.cpp" \
    -I. -I"$work/stubs" -sUSE_SDL=1 -sENVIRONMENT=web -o "$meta/snake/snake.js" )

# DevilScript (2015) and St Bernand Script (2016): the interpreters unchanged;
# the stdin loop in main replaced by a per-line function the page calls.
clone DevilScript 1df417e
( cd "$work/DevilScript"
  em++ -std=c++14 -w -O2 Lexer.cpp Parser.cpp Stack.cpp "$here/devilscript/devilscript_web.cpp" -I. \
    -sENVIRONMENT=web -sMODULARIZE -sEXPORT_NAME=DevilScript -sEXPORTED_RUNTIME_METHODS=cwrap -sALLOW_MEMORY_GROWTH \
    -o "$meta/devilscript/devilscript.js" )

clone StBernandScript 0b4b262
( cd "$work/StBernandScript"
  em++ -std=c++14 -w -O2 $(ls *.cpp | grep -v -e '^main.cpp$' -e '^StBernand.cpp$') "$here/stbernand/stbernand_web.cpp" -I. \
    -sENVIRONMENT=web -sMODULARIZE -sEXPORT_NAME=StBernand -sEXPORTED_RUNTIME_METHODS=cwrap -sALLOW_MEMORY_GROWTH \
    -o "$meta/stbernand/stbernand.js" )

# Rust browser engine (2018): unchanged, built for WASI. The page supplies
# example/index.html and example/index.css through an in-memory filesystem.
clone Rust_browser_engine fad09a0
( cd "$work/Rust_browser_engine"
  cargo build -q --release --target wasm32-wasip1
  cp target/wasm32-wasip1/release/browser.wasm "$meta/rust-browser/browser.wasm" )

# Rost (2022): the compiler from the rost repository, built to WebAssembly and
# shrunk with wasm-opt as wasm-pack would; its demo app with the reworked UI in
# rost-playground/ laid over it, built under /rost/.
clone rost fa92fe9
( cd "$work/rost"
  cargo build -q --release --target wasm32-unknown-unknown -p rost_wasm
  wasm-bindgen --target bundler --out-dir demo/src/rost --out-name rost_wasm target/wasm32-unknown-unknown/release/rost_wasm.wasm
  "$wasm_opt" -Oz --enable-bulk-memory --enable-nontrapping-float-to-int --enable-sign-ext --enable-mutable-globals \
    demo/src/rost/rost_wasm_bg.wasm -o demo/src/rost/rost_wasm_bg.wasm
  rm -f demo/src/App.css demo/src/executeWasm.tsx
  cp "$here/rost-playground/index.html" demo/index.html
  cp "$here/rost-playground/src/"* demo/src/
  cd demo && npm install --silent --no-audit --no-fund
  npx vite build --base=/rost/ --outDir "$work/rost-dist" --emptyOutDir
  rm -rf "$meta/rost" && mkdir -p "$meta/rost" && cp -r "$work/rost-dist/"* "$meta/rost/" && rm -f "$meta/rost/vite.svg" )

# Markov chain (2015) and the Driverless pure pursuit simulation (2020) are
# Python, run by Pyodide in the page; their source files are copied as they are.
clone Markov f8ec8dc
cp "$work/Markov/Markov.py" "$meta/markov/Markov.py"
clone pure-pursuit 00d4f36
cp "$work/pure-pursuit/app.py" "$work/pure-pursuit/path.json" "$meta/pure-pursuit/"

echo "Rebuilt into meta/. The Markov training text, meta/markov/blog-sentences.txt, is not regenerated."
