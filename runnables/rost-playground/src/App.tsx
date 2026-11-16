import { useCallback, useEffect, useRef, useState } from "react";
import WabtModule from "./libwabt";
import { MainEditor } from "./MainEditor";
import { Wabt } from "./types";
import { RostCompiler, RunResult, runRost } from "./RostCompiler";
import { examples } from "./examples";

function Playground({ wabt }: { wabt: Wabt }) {
  const [code, setCode] = useState(examples[0].code);
  const [example, setExample] = useState(examples[0].name);
  const [result, setResult] = useState<RunResult>();
  const [running, setRunning] = useState(false);
  const features = useRef<Record<string, boolean>>(
    Object.fromEntries(Object.keys(wabt.FEATURES).map((f) => [f, false]))
  );
  const latest = useRef(code);
  latest.current = code;

  const run = useCallback(async () => {
    setRunning(true);
    setResult(await runRost(latest.current, wabt, features.current));
    setRunning(false);
  }, [wabt]);

  useEffect(() => { run(); }, [run]);

  // Keep the latest code in a ref synchronously, so a run fired straight after an
  // edit (paste, then Cmd+Enter) never sees the previous render's code.
  const onChange = (value: string) => {
    latest.current = value;
    setCode(value);
  };

  const pickExample = (name: string) => {
    const picked = examples.find((e) => e.name === name)!;
    setExample(name);
    setCode(picked.code);
    latest.current = picked.code;
    run();
  };

  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <div className="app">
      <header className="bar">
        <h1>Rost <span>playground</span></h1>
        {examples.length > 1 && (
          <label>
            Example
            <select value={example} onChange={(e) => pickExample(e.target.value)}>
              {examples.map((e) => <option key={e.name}>{e.name}</option>)}
            </select>
          </label>
        )}
        <span className="spacer" />
        <a className="about" href="/blog/rost/" target="_blank" rel="noopener">Read about Rost</a>
        <span className="hint"><kbd>{isMac ? "⌘" : "Ctrl"}</kbd> <kbd>Enter</kbd> to run</span>
        <button className="run" onClick={run}>Run</button>
      </header>
      <main className="main">
        <div className="editor">
          <MainEditor value={code} onChange={onChange} onRun={run} />
        </div>
        <RostCompiler result={result} running={running} />
      </main>
    </div>
  );
}

function App() {
  const [wabt, setWabt] = useState<Wabt>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    WabtModule().then(setWabt, () => setFailed(true));
  }, []);

  if (failed) return <div className="loading">Could not load the WebAssembly assembler.</div>;
  if (!wabt) return <div className="loading">Loading the Rost compiler…</div>;
  return <Playground wabt={wabt} />;
}

export default App;
