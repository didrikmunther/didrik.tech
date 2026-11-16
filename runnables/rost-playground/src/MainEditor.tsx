import Editor, { type Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

// Rost highlighting, from the keyword and type lists in the Rost VS Code grammar.
function registerRost(monaco: Monaco) {
  if (monaco.languages.getLanguages().some((l: { id: string }) => l.id === "rost")) return;

  monaco.languages.register({ id: "rost" });
  monaco.languages.setMonarchTokensProvider("rost", {
    keywords: ["__builtin", "pub", "let", "fn", "if", "else", "for", "while", "return"],
    types: ["int", "float", "double", "char", "void", "str", "bool", "any"],
    storage: ["struct", "enum"],
    tokenizer: {
      root: [
        [/\/\/.*$/, "comment"],
        [/\/\*/, "comment", "@comment"],
        [/"([^"\\]|\\.)*"/, "string"],
        [/\b\d+\b/, "number"],
        [/\bfn\b(?=\s+[a-zA-Z_])/, "keyword", "@fnName"],
        [/[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/, "function"],
        [/[a-zA-Z_][a-zA-Z0-9_]*/, { cases: { "@keywords": "keyword", "@types": "type", "@storage": "keyword", "@default": "identifier" } }],
        [/[{}()[\]]/, "delimiter.bracket"],
        [/[+\-*/%=!<>]/, "operator"],
      ],
      fnName: [
        [/\s+/, "white"],
        [/[a-zA-Z_][a-zA-Z0-9_]*/, "function.declaration", "@pop"],
      ],
      comment: [
        [/[^/*]+/, "comment"],
        [/\*\//, "comment", "@pop"],
        [/[/*]/, "comment"],
      ],
    },
  });
  monaco.languages.setLanguageConfiguration("rost", {
    comments: { lineComment: "//", blockComment: ["/*", "*/"] },
    brackets: [["{", "}"], ["[", "]"], ["(", ")"]],
    autoClosingPairs: [{ open: "{", close: "}" }, { open: "(", close: ")" }, { open: "[", close: "]" }, { open: '"', close: '"' }],
  });
  monaco.editor.defineTheme("rost-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "c9a0ff" },
      { token: "type", foreground: "7fb3ff" },
      { token: "function", foreground: "e6c07b" },
      { token: "function.declaration", foreground: "e6c07b", fontStyle: "bold" },
      { token: "string", foreground: "8fd98f" },
      { token: "number", foreground: "f5a97f" },
      { token: "comment", foreground: "6b7685", fontStyle: "italic" },
      { token: "operator", foreground: "a9b4c2" },
    ],
    colors: {
      "editor.background": "#1e232a",
      "editor.lineHighlightBackground": "#262c35",
      "editorLineNumber.foreground": "#4a5361",
      "editorLineNumber.activeForeground": "#8b96a3",
      "editorGutter.background": "#1e232a",
      "editorBracketHighlight.foreground1": "#a9b4c2",
      "editorBracketHighlight.foreground2": "#a9b4c2",
      "editorBracketHighlight.foreground3": "#a9b4c2",
      "editorBracketHighlight.foreground4": "#a9b4c2",
      "editorBracketHighlight.foreground5": "#a9b4c2",
      "editorBracketHighlight.foreground6": "#a9b4c2",
    },
  });
}

export function MainEditor({
  value,
  onChange,
  onRun,
}: {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
}) {
  const onMount = (ed: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => onRun());
    ed.focus();
  };

  return (
    <Editor
      height="100%"
      language="rost"
      theme="rost-dark"
      value={value}
      beforeMount={registerRost}
      onMount={onMount}
      onChange={(v) => onChange(v ?? "")}
      loading={<div className="loading">Loading the editor…</div>}
      options={{
        fontFamily: '"SF Mono", Menlo, Consolas, monospace',
        fontSize: 14,
        lineHeight: 22,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        renderLineHighlight: "line",
        padding: { top: 14, bottom: 14 },
        overviewRulerLanes: 0,
        occurrencesHighlight: "off",
        selectionHighlight: false,
        bracketPairColorization: { enabled: false },
        guides: { indentation: true, bracketPairs: false },
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
      }}
    />
  );
}
