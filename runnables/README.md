# Runnable projects

Ten projects on the projects page open in a modal and run in the visitor's
browser. Each one is a standalone page under `meta/`, copied to the site root
by the normal build, and the modal loads that page in an iframe only when a
visitor presses **Run it here**. `src/script/run.js` drives the modal; every
run button is also a plain link, so without JavaScript it opens the page in a
new tab.

| Project | Page | How it runs |
| --- | --- | --- |
| Rost (2022) | `/rost/` | Rost's own playground from its `demo/` folder, with the reworked UI in `rost-playground/`: the compiler built to WebAssembly, compiling Rost to WebAssembly in the page |
| Web Audio API Synth (2020) | `/audio/` | The existing build |
| Flappy Bird AI (2020) | `/flappy/` | The existing build |
| KTH FS Driverless (2020) | `/pure-pursuit/` | The pure pursuit `app.py`, run by Pyodide with NumPy (about 9 MB, from jsDelivr) in a web worker. A stand-in for matplotlib records each frame and the page draws it on a canvas; the only change to `app.py` is that the lookahead comes from the slider |
| Rust browser engine (2018) | `/rust-browser/` | The unchanged crate built for `wasm32-wasip1`, run with the vendored `browser_wasi_shim` |
| St Bernand Script (2016) | `/stbernand/` | The interpreter built with Emscripten; `stbernand/stbernand_web.cpp` replaces the stdin loop |
| DevilScript (2015) | `/devilscript/` | The interpreter built with Emscripten; `devilscript/devilscript_web.cpp` replaces the stdin loop |
| Markov chain (2015) | `/markov/` | The chain functions from `Markov.py`, run by Pyodide (about 6 MB) and trained on this site's blog posts |
| Third (2014) | `/third/` | The existing build |
| Snake (2013) | `/snake/` | The game built with Emscripten's SDL 1.2; `snake/web_main.cpp` replaces the blocking main loop |

The projects' own source files are compiled unchanged. Where a program read
stdin in a loop or ran a blocking game loop, which a browser tab cannot do, a
small adapter in this folder takes over only that part.

`build.sh` rebuilds everything from the projects' repositories at the commits
used here. It was last run with Emscripten 7.0.0, Rust 1.91, wasm-bindgen-cli 0.2.93 and
Node 24. The existing builds of the synth, Flappy Bird AI and Third are not
rebuilt by it.

Two edits outside the projects' sources, both to existing builds in `meta/`:

- `meta/audio/static/js/main.*.chunk.js`: when the browser refused Web MIDI,
  the synth stored the error object and rendered it, which crashed React and
  left a blank page. It now stores the message. The same fix belongs in the
  `react-audiocontext` repository.
- `meta/run/vendor/browser_wasi_shim` is `@bjorn3/browser_wasi_shim` 0.4.2
  (MIT or Apache-2.0).

The Rost playground's UI lives in `rost-playground/`, laid over the `demo/`
app from the rost repository at build time. Its examples stick to what Rost's
WebAssembly backend compiles today. As of commit `fa92fe9`, that backend
reports `if`, `while` and `return` as not supported, panics on `-`, `/` and
generic functions, and keeps only the first string of a string `+`. When the
compiler panics, the playground now says so instead of leaving the previous
output on screen.
