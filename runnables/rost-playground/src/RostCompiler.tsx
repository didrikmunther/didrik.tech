import { useState } from "react";
import { Wabt } from "./types";
import { WasmExecutor } from "./WasmExecutor";
import { compile } from "./rost/rost_wasm";

type MainWasmObject = { __main: () => void };
type Stage = "lexed" | "parsed" | "compiled" | "wasm";
type Tab = "output" | Stage;

const tabs: { id: Tab; label: string }[] = [
  { id: "output", label: "Output" },
  { id: "lexed", label: "Tokens" },
  { id: "parsed", label: "Syntax tree" },
  { id: "compiled", label: "IR" },
  { id: "wasm", label: "WebAssembly text" },
];

const batch_size = 128;
const max_until_overflow = 1024;

export type RunResult = {
  stages: Partial<Record<Stage, string>>;
  error?: { stage: string; message: string };
  rows: string[];
};

// Compile with the Rost compiler (Rust, built to WebAssembly), assemble the WAT
// it emits with wabt, and run the module with print/printi wired to the output.
export async function runRost(code: string, wabt: Wabt, features: Record<string, boolean>): Promise<RunResult> {
  const result: RunResult = { stages: {}, rows: [] };
  let compiled: ReturnType<typeof compile>;
  try {
    compiled = compile(code);
  } catch (e) {
    // A panic inside the compiler surfaces here as a WebAssembly trap.
    result.error = { stage: "The compiler", message: `It crashed on this program (${String(e)}). This is a bug in Rost, not in your code.` };
    return result;
  }
  const steps: [Stage, () => string][] = [
    ["lexed", () => compiled.get_lexed()],
    ["parsed", () => compiled.get_parsed()],
    ["compiled", () => compiled.get_compiled()],
    ["wasm", () => compiled.get_wasm()],
  ];

  for (const [stage, step] of steps) {
    try {
      result.stages[stage] = step();
    } catch (e) {
      const message = e instanceof WebAssembly.RuntimeError
        ? `The compiler crashed at this stage (${e.message}). This is a bug in Rost, not in your code.`
        : String(e);
      result.error = { stage: tabs.find((t) => t.id === stage)!.label, message };
      return result;
    }
  }

  const memory = new WebAssembly.Memory({ initial: 1 });
  const print = (offset: number) => {
    let string = "";
    let new_offset = offset;
    let finished = false;
    while (!finished && new_offset - offset < max_until_overflow) {
      const bytes = new Uint8Array(memory.buffer, new_offset, batch_size);
      for (const char of new TextDecoder("utf8").decode(bytes)) {
        if (char === "\0") { finished = true; break; }
        string += char;
      }
      new_offset += batch_size;
    }
    result.rows.push(string);
  };
  const printi = (integer: number) => { result.rows.push(integer.toString()); };

  try {
    const module = wabt.parseWat("program.wat", result.stages.wasm!, {});
    module.resolveNames();
    module.validate(features);
    const binary = module.toBinary({ log: false, write_debug_names: true });
    const { instance } = await WebAssembly.instantiate(new Uint8Array(binary.buffer), {
      imports: { print, printi },
      js: { mem: memory },
    });
    (instance.exports as unknown as MainWasmObject).__main();
  } catch (e) {
    result.error = { stage: "Running", message: String(e) };
  }

  return result;
}

export function RostCompiler({ result, running }: { result?: RunResult; running: boolean }) {
  const [tab, setTab] = useState<Tab>("output");

  return (
    <section className="side" aria-label="Result">
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="panel" role="tabpanel">
        {result?.error && (
          <div className="error">
            <strong>{result.error.stage} failed</strong>
            {result.error.message}
          </div>
        )}
        {tab === "output" ? (
          result && !result.error ? <WasmExecutor rows={result.rows} running={running} /> : !result && <p className="empty">Press Run.</p>
        ) : result?.stages[tab] ? (
          <pre>{result.stages[tab]}</pre>
        ) : (
          !result?.error && <p className="empty">Press Run to see this stage.</p>
        )}
      </div>
    </section>
  );
}
