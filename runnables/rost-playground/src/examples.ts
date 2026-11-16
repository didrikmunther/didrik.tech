// Example programs for the playground. Each one sticks to what Rost's
// WebAssembly backend compiles today: functions, let bindings, + and * on
// integers, string literals, and the print/printi builtins.
const builtins = `__builtin fn print(content: str);
__builtin fn printi(content: int);
`;

export const examples: { name: string; code: string }[] = [
  {
    name: "Functions",
    code: `${builtins}
fn show(label: str, value: int) {
	print(label);
	printi(value);
}

fn area(width: int, height: int) {
	show("Area", width * height);
}

fn main() {
	area(6, 7);
	area(12, 3);
}`,
  },
  {
    name: "Arithmetic",
    code: `${builtins}
fn main() {
	printi(2 * 3 + 4);
	printi(2 * (3 + 4));

	let answer = 6 * 7;
	printi(answer);
	printi(answer + answer * 2);
}`,
  },
  {
    name: "Variables",
    code: `${builtins}
fn main() {
	let greeting = "Hello from Rost";
	print(greeting);

	let year: int = 2022;
	let next = year + 1;
	printi(next);
}`,
  },
  {
    name: "A compiler error",
    code: `${builtins}
fn main() {
	print("This line is missing its semicolon")
	print("so the parser stops here");
}`,
  },
];
