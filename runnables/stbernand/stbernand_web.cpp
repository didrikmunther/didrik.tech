// Web entry point for St Bernand Script (2016). StBernand::start() reads lines
// from stdin in a loop; this does the same work for one line at a time, called
// from the page, with the options main.cpp sets. Every other file is the
// original, unchanged.
#include <emscripten.h>
#include <iostream>
#include <sstream>
#include <string>

#include "Lexer.hpp"
#include "Parser.hpp"
#include "Stack.hpp"
#include "Object.hpp"
#include "Options.hpp"

static Lexer lexer;
static Stack stack;
static Parser parser;
static std::string result;
static bool started = false;

static void start() {
    // From main.cpp: the default options.
    Options::_Options = (Options::Option)((int)Options::Option::PrintErrPosition |
                                          (int)Options::Option::PrintExpected);
    // From StBernand::start(): the built-in constants.
    stack.addVariable("true", stack.addObject(new Object(stack.addFloat(1), t_type_bool, true)));
    stack.addVariable("false", stack.addObject(new Object(stack.addFloat(0), t_type_bool, true)));
    stack.addVariable("null", stack.addObject(new Object(nullptr, t_null, true)));
    started = true;
}

extern "C" EMSCRIPTEN_KEEPALIVE const char* stbernand_eval(const char* line) {
    if (!started) start();

    std::ostringstream captured;
    std::streambuf* original = std::cout.rdbuf(captured.rdbuf());

    // The body of StBernand::start()'s loop.
    auto lexed = lexer.lex(std::string(line), Lexer::Options::Lex);
    auto ret = parser.parse(lexed, &stack);
    std::cout << ret.first << "\n";
    stack.clear();

    std::cout.rdbuf(original);
    result = captured.str();
    return result.c_str();
}
