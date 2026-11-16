// Loads Pyodide (CPython compiled to WebAssembly) on demand, once per page.
const VERSION = '0.27.2';
let pending = null;

export function loadPython(onStatus = () => {}) {
  if (pending) return pending;
  pending = new Promise((resolve, reject) => {
    onStatus('Downloading Python (about 6 MB, only the first time)…');
    const script = document.createElement('script');
    script.src = `https://cdn.jsdelivr.net/pyodide/v${VERSION}/full/pyodide.js`;
    script.onload = () => window.loadPyodide({ indexURL: `https://cdn.jsdelivr.net/pyodide/v${VERSION}/full/` }).then(resolve, reject);
    script.onerror = () => reject(new Error('Could not download Pyodide.'));
    document.head.appendChild(script);
  });
  return pending;
}
