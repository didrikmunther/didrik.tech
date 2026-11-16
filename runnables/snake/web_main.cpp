// Web entry point for snakecode (2013). The original CApp::OnExecute runs a
// blocking while-loop, which a browser tab cannot do; this drives the same
// public OnInit / OnEvent / OnLoop / OnRender methods from the browser's frame
// loop instead. The game's own source files are compiled unchanged.
#include <emscripten.h>
#include "CApp.h"

static CApp* app;

static void frame() {
    SDL_Event event;
    while (SDL_PollEvent(&event)) app->OnEvent(&event);
    app->OnLoop();
    app->OnRender();
}

int main() {
    app = new CApp();
    if (!app->OnInit()) return 1;
    emscripten_set_main_loop(frame, FPS, 1);
    return 0;
}
