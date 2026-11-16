export function WasmExecutor({ rows, running }: { rows: string[]; running: boolean }) {
  if (rows.length === 0) {
    return <p className="empty">{running ? "Running…" : "The program printed nothing."}</p>;
  }

  return (
    <ol className="output">
      {rows.map((row, index) => (
        <li key={index}>
          <span>{index + 1}</span>
          <code>{row}</code>
        </li>
      ))}
    </ol>
  );
}
