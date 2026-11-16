// A small terminal for the language REPLs: one line in, the interpreter's
// output back. The interpreter itself is the original C++, compiled to
// WebAssembly; `evaluate` is the per-line entry point each build exports.
export function mountRepl({ factory, evaluate, banner, examples, prompt = '>' }) {
  const log = document.getElementById('log');
  const input = document.getElementById('input');
  const status = document.getElementById('status');
  const history = [];
  let cursor = 0;
  let run = null;

  const escape = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const append = html => { log.insertAdjacentHTML('beforeend', html); log.scrollTop = log.scrollHeight; };

  function submit(line) {
    if (!run) return;
    append(`<span class="d">${prompt}</span> <span class="t">${escape(line)}</span>\n`);
    const out = run(line);
    const isError = /\[Error\]|----\^/.test(out);
    if (out) append(`<span class="${isError ? 'e' : 's'}">${escape(out.replace(/\n+$/, ''))}</span>\n`);
    if (line.trim()) { history.push(line); cursor = history.length; }
  }

  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') { submit(input.value); input.value = ''; }
    else if (event.key === 'ArrowUp' && cursor > 0) { input.value = history[--cursor]; event.preventDefault(); }
    else if (event.key === 'ArrowDown') { cursor = Math.min(cursor + 1, history.length); input.value = history[cursor] || ''; event.preventDefault(); }
  });

  const chips = document.getElementById('examples');
  for (const example of examples) {
    const button = document.createElement('button');
    button.textContent = example;
    button.addEventListener('click', () => { submit(example); input.focus(); });
    chips.appendChild(button);
  }

  factory().then(module => {
    run = module.cwrap(evaluate, 'string', ['string']);
    if (banner) append(`<span class="a banner">${escape(banner(module))}</span>\n\n`);
    status.textContent = '';
    input.disabled = false;
    input.focus();
  }).catch(error => { status.textContent = `Could not start: ${error.message || error}`; });
}
