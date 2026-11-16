// Dev-only chrome: the Demo / Worst case / Empty / One / 1,000 switch that
// scripts/break-ui.sh drops on each rendered copy of the projects page. It is
// deliberately plain and sits outside the component under test.

const fs = require('fs');

const [file, current] = process.argv.slice(2);

const states = [
    ['demo', 'Demo data'],
    ['worst', 'Worst case'],
    ['empty', 'Empty'],
    ['one', 'One'],
    ['huge', '1,000']
];

const segments = states.map(([state, label]) => {
    const active = state === current;
    const style = [
        'padding: 6px 14px',
        'border-radius: 6px',
        'font: 500 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        'text-decoration: none',
        active ? 'background: #fff; color: #111; box-shadow: 0 1px 2px rgba(0,0,0,.2)' : 'color: #d4d4d8'
    ].join('; ');

    return `<a href="/break/${state}/" style="${style}">${label}</a>`;
}).join('');

const toggle = `
<div data-break-ui-toggle style="position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%); z-index: 9999; display: flex; gap: 4px; padding: 4px; border-radius: 9px; background: #27272a; box-shadow: 0 6px 20px rgba(0,0,0,.35);">${segments}</div>
`;

fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('</body>', toggle + '</body>'));
