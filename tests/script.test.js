const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

test('the site script runs without Babel runtime helpers the page does not load', () => {
    const script = fs.readFileSync(path.resolve(__dirname, '../dist/en/script.js'), 'utf8');
    assert(!script.includes('regeneratorRuntime'), 'Avoid async/await and generators in src/script');
});
