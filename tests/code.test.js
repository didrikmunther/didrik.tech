const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const posts = fs.readdirSync(path.join(root, 'src/html/blog'))
    .filter(file => file.endsWith('.md'))
    .map(file => path.basename(file, '.md'));
const readPost = post => fs.readFileSync(path.join(root, 'dist/en/blog', post, 'index.html'), 'utf8');
const codeBlocks = html => [...html.matchAll(/<pre\b[^>]*>[\s\S]*?<\/pre>/g)].map(match => match[0]);
const text = html => html
    .replace(/<[^>]*>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const colors = html => new Set([...html.matchAll(/color:(#[0-9a-f]{6})/gi)].map(match => match[1].toLowerCase()));

test('blog code blocks are highlighted at build time without highlight.js', () => {
    for (const post of posts) {
        const html = readPost(post);
        assert(!html.includes('hljs'), `${post} must not contain highlight.js markup or scripts`);
        for (const block of codeBlocks(html)) {
            assert.match(block, /^<pre class="shiki /, `${post} has an unhighlighted code block`);
        }
    }
});

test('Rost code keeps its exact source text and gets real token colors', () => {
    const source = fs.readFileSync(path.join(root, 'src/html/blog/rost.md'), 'utf8');
    const fence = source.match(/```rost\n([\s\S]*?)\n```/)[1];
    const block = codeBlocks(readPost('rost')).find(html => text(html).includes('fn add_two_things<T>'));
    assert.equal(text(block), fence);
    assert(colors(block).size >= 4, 'Rost keywords, functions, strings, and numbers should be colored');
});

test('fences are decoded, highlighted, and fall back to plain text for unknown languages', async () => {
    const { highlightCodeBlocks } = await import('../src/code/highlight.mjs');
    const html = await highlightCodeBlocks([
        '<p>Before</p>',
        '<pre><code class="rost"><span class="hljs-keyword">fn</span> f() { printf(&quot;a &amp; b&quot;, 1 &lt; 2); }\n</code></pre>',
        '<pre><code class="text">a &lt;b&gt; &#x27;c&#x27;\n</code></pre>',
        '<pre><code class="not-a-language">plain\n</code></pre>'
    ].join('\n'));
    const blocks = codeBlocks(html);
    assert(html.startsWith('<p>Before</p>'));
    assert.equal(blocks.length, 3);
    assert.equal(text(blocks[0]), 'fn f() { printf("a & b", 1 < 2); }');
    assert(colors(blocks[0]).size > 2);
    assert.equal(text(blocks[1]), "a <b> 'c'");
    assert.equal(text(blocks[2]), 'plain');
});
