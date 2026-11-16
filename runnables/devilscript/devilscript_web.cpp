// Web entry point for DevilScript (2015). main.cpp's programShell() reads lines
// from stdin in a loop; this does the same work for one line at a time, called
// from the page. Lexer, Parser and Stack are the original files, unchanged.
#include <emscripten.h>
#include <iostream>
#include <sstream>
#include <string>

#include "Lexer.h"
#include "Parser.h"
#include "Stack.h"

static Lexer* lexer = new Lexer();
static Parser* parser = new Parser();
static Stack* stack = new Stack();
static std::string result;

extern "C" {

EMSCRIPTEN_KEEPALIVE const char* devilscript_banner() {
    // The banner programShell() prints, verbatim.
    result = "D̴̜e͉̩͈̝͈̩͘v̩il̤̖̣S͏̪̼̪͈̻c̪̪͔͈͢r̶͓̘̺̱i̗̠̟p̮̖t̥̻̬͉ ͚̙͖̩s̼͙̗͖͓̫t̙̘̖̺̩a͟r̡̯̜̯t̝̤̻͙͝e̞̩d̰͕̩̞̥̫!͔̗̜͠ ̸̳̺͓͕̖̗ͅ>̜>̟̰";
    return result.c_str();
}

EMSCRIPTEN_KEEPALIVE const char* devilscript_eval(const char* line) {
    std::string input(line);
    std::ostringstream captured;
    std::streambuf* original = std::cout.rdbuf(captured.rdbuf());

    if (input == "restart!") {
        // programShell() returns 1 on restart!, and executeProgram() starts a fresh shell.
        delete lexer; delete parser; delete stack;
        lexer = new Lexer(); parser = new Parser(); stack = new Stack();
        std::cout << "(restarted)\n";
    } else {
        auto output = parser->parse(lexer->lex(input), stack, lexer);
        for (auto& i : output)
            std::cout << i << (i == "" ? "" : "\n");
    }

    std::cout.rdbuf(original);
    result = captured.str();
    return result.c_str();
}

}
