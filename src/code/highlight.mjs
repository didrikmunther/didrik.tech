// Build-time syntax highlighting for code blocks.
//
// static-site renders Markdown fences as <pre><code class="LANG"> with highlight.js markup
// inside. This module replaces each block with Shiki output, which uses VS Code's TextMate
// grammars and themes, so pages need no highlighting script. The theme sets the colors.
//
// Extra grammars live in ./grammars as <language>.tmLanguage.json and are used for fences
// with that language name. rost.tmLanguage.json is copied from the Rost VS Code extension
// (github.com/didrikmunther/rost, lsp-client/syntaxes).
//
// Usage: node src/code/highlight.mjs <directory>

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { bundledLanguages, createHighlighter } from 'shiki';

const theme = 'one-dark-pro';
const grammarDirectory = fileURLToPath(new URL('./grammars/', import.meta.url));
const codeBlock = /<pre><code(?: class="([^"]*)")?>([\s\S]*?)<\/code><\/pre>/g;
const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

let highlighterPromise;

const createSiteHighlighter = async () => {
    const files = (await readdir(grammarDirectory)).filter(file => file.endsWith('.tmLanguage.json'));
    const grammars = await Promise.all(files.map(async file => ({
        ...JSON.parse(await readFile(path.join(grammarDirectory, file), 'utf8')),
        name: path.basename(file, '.tmLanguage.json')
    })));
    return createHighlighter({ themes: [theme], langs: grammars });
};

// highlight.js output only contains markup and escaped text, so removing tags and decoding
// entities recovers the original code.
const decode = html => html
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (entity, name) => {
        if (name[0] !== '#') return entities[name.toLowerCase()] ?? entity;
        return String.fromCodePoint(name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10));
    });

const loadLanguage = async (highlighter, className = '') => {
    const language = className.replace(/^language-/, '');
    if (!language || language === 'text' || language === 'plaintext') return 'text';
    if (highlighter.getLoadedLanguages().includes(language)) return language;
    if (language in bundledLanguages) {
        await highlighter.loadLanguage(language);
        return language;
    }
    console.warn(`No grammar for code block language "${language}"; leaving it unhighlighted.`);
    return 'text';
};

export async function highlightCodeBlocks(html) {
    if (!html.includes('<pre><code')) return html;
    highlighterPromise ??= createSiteHighlighter();
    const highlighter = await highlighterPromise;

    const blocks = [...html.matchAll(codeBlock)];
    const highlighted = [];
    for (const [, className, content] of blocks) {
        const lang = await loadLanguage(highlighter, className);
        // Markdown keeps the fence's final newline, which would render as an empty last line.
        highlighted.push(highlighter.codeToHtml(decode(content).replace(/\n$/, ''), { lang, theme }));
    }
    let index = 0;
    return html.replace(codeBlock, () => highlighted[index++]);
}

export async function highlightDirectory(directory) {
    const files = (await readdir(directory, { recursive: true })).filter(file => file.endsWith('.html'));
    for (const file of files) {
        const filePath = path.join(directory, file);
        const html = await readFile(filePath, 'utf8');
        const highlighted = await highlightCodeBlocks(html);
        if (highlighted !== html) await writeFile(filePath, highlighted);
    }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const directory = process.argv[2];
    if (!directory) {
        console.error('Usage: node src/code/highlight.mjs <directory>');
        process.exit(1);
    }
    await highlightDirectory(directory);
}
