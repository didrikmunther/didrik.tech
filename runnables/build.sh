#!/bin/bash

# Rebuilds the runnable projects that open in the projects-page modal, from
# their own repositories at pinned commits, into meta/. Needs git, Emscripten
# (emcc on PATH) and Rust with the wasm32-wasip1 target. Rost's playground in
# meta/rost/ is built separately, with generate-demo.sh in the rost repository.
#
#   source /path/to/emsdk/emsdk_env.sh
#   bash runnables/build.sh

set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
meta="$here/../meta"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

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

# Markov chain (2015) and the Driverless exercise (2019) are Python, run by
# Pyodide in the page; their source files are copied as they are.
clone Markov f8ec8dc
cp "$work/Markov/Markov.py" "$meta/markov/Markov.py"
clone kthfsdv b72a41d
cp "$work/kthfsdv/exercise2/app.py" "$meta/kthfsdv/app.py"

echo "Rebuilt into meta/. The Markov training text, meta/markov/blog-sentences.txt, is not regenerated."
