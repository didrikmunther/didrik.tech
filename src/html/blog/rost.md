---
title: 'Rost: a typed programming language built in Rust'
description: How I built Rost, a statically typed programming language in Rust with generics, a language server, and Python and WebAssembly backends.
footerColor: bg-blue-800
postTitle: 'Rost: a typed programming language built in Rust'
author: Didrik Munther
authorImg: /static/didrik-closeup.jpg
coverImg: /static/blog/rost/rost-generics-cover.jpg
coverImgAlt: Rost code in VS Code with syntax highlighting, defining a generic function and calling it with integers and with strings.
coverImgPosition: center
sitemapImages:
  - /static/third.webp
  - /static/blog/rost/rost-vscode-type-errors.webp
date: 30 September 2024
datePublished: '2024-09-30'
dateModified: '2026-10-27'
template: ../templates/post.html
block: post
---

Rost is a statically typed programming language I've built in Rust. It has generics, type checking, error messages that point to the exact code, and a language server for VS Code. The compiler outputs Python or WebAssembly, and you can [try it in your browser](https://didrik.tech/rost/). The name is Swedish for rust.

I've made a lot of programming languages from scratch, and Rost is the latest one.

### Where it started

My oldest GitHub repositories are small C++ games from 9th grade, like Snake and Pong. In 2015, I started building [Third](https://github.com/didrikmunther/Third), a 2D platformer engine in C++ and SDL with a built-in map editor.

<figure class="my-8">
  <a href="/static/third.webp" aria-label="Open the Third screenshot at full size">
    <img
      src="/static/third.webp"
      alt="Third, a 2D platformer engine in C++, with a red player character and a blue knight on grassy stone platforms."
      width="2878" height="1844"
      loading="lazy" decoding="async"
      class="w-full h-auto rounded-lg border border-gray-200">
  </a>
  <figcaption class="mt-3 text-sm text-gray-600">Third, the 2D platformer engine where I first embedded Lua.</figcaption>
</figure>

In October 2015, after a few experiments with Lua bindings, I added Lua scripting to Third, so things like movement, projectiles, chat, and spells could be written as Lua scripts. That's when I got interested in making languages myself. Six days later, I started DevilScript, my first language on GitHub:

```text
a = 5
b = 10
c = a + b
ptc! This is a line that is printed
```

More followed:

- [StBernandScript](https://github.com/didrikmunther/StBernandScript) (2016, C++): variables, strings, constants, and arithmetic with parentheses.
- [Rust_interpreter](https://github.com/didrikmunther/Rust_interpreter) (2018, Rust): an expression-based language compiled to bytecode for a small virtual machine.
- [rust-lang-2](https://github.com/didrikmunther/rust-lang-2) (2020, Rust): functions as values and lists, compiled to instructions for a virtual machine.

### Rost

I started Rost in August 2022. The first version compiled straight to x86-64 assembly for NASM. Within ten days it had arithmetic, type inference, if statements, while loops, and colored error messages, and over the next year it got functions, pointers, structs, and arrays.

In September 2024, I rewrote the compiler around an intermediate representation, added generics, and added two new backends: one that generates Python and one that generates WebAssembly. Here's a generic function, compiled with the Python backend:

```rost
__builtin fn printf(format: str, ...args: any);

fn add_two_things<T>(format: str, a: T, b: T) {
	let c: T = a + b;

	printf(format, a, b, c);
}

fn main() {
	add_two_things("%i + %i = %i\n", 1, 5);
	add_two_things("%s + %s = %s\n", "abc", "def");
}
```

```text
1 + 5 = 6
abc + def = abcdef
```

`__builtin` declares a function that the backend provides. In the Python backend, `printf` uses Python's string formatting.

The rewrite doesn't support everything the first version did yet: loops, if statements, and structs are still on the roadmap.

### Error messages and editor support

Rost points to every piece of code involved in an error. Calling a function with the wrong type gives:

```text
  --> input.ro:4:10, input.ro:1:12 => CompilerError
1 | fn my_func(in: int) {}
  |            ^^
  |            └─ Expected int in declaration
2 |
3 | fn main() {
4 |     my_func("abc");
  |             ^^^^^
  |             └─ Wrong type in function call: str
5 | }
```

I also wrote a language server for Rost. With its VS Code extension, the same errors show up as you type, and you can hover over code to see types and jump to definitions.

<figure class="my-8">
  <a href="/static/blog/rost/rost-vscode-type-errors.webp" aria-label="Open the VS Code screenshot at full size">
    <img
      src="/static/blog/rost/rost-vscode-type-errors.webp"
      alt="VS Code showing Rost compiler errors inline: Expected int in declaration, and Wrong type in function call: str."
      width="1074" height="168"
      loading="lazy" decoding="async"
      class="w-full h-auto rounded-lg border border-gray-200">
  </a>
  <figcaption class="mt-3 text-sm text-gray-600">The same type errors from the Rost language server in VS Code. <a href="/static/blog/rost/rost-vscode-type-errors.webp">Open the full-size image.</a></figcaption>
</figure>

### From Rost to my master's thesis

Making my own languages is what led me to my master's thesis at KTH. Editor support like this makes a language much easier to use, but it takes a lot of work to build. With tools like Langium or Xtext, a language that already has a compiler typically has to implement its semantics a second time to get it.

In [Semi-Automatic LSP Server Generation for Domain-Specific Languages](https://kth.diva-portal.org/smash/record.jsf?pid=diva2%3A1957912), I proposed reusing what the compiler already knows instead: metadata attached during compilation provides language server features such as go-to definition and hover information. I demonstrated the approach in the Miking language workbench and evaluated it on two domain-specific languages, MLang and ProbTime. The results show that language support can be derived semi-automatically with minimal manual work.

### Try it

[The Rost demo](https://didrik.tech/rost/) compiles your code to WebAssembly and runs it in the browser. The source code is [on GitHub](https://github.com/didrikmunther/rost).
