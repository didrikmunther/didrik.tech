const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const site = path.join(root, 'dist/en');
const projects = YAML.parse(fs.readFileSync(path.join(root, 'src/data/projects.yaml'), 'utf8')).projects;
const page = fs.readFileSync(path.join(site, 'projects/index.html'), 'utf8');

const RUNNABLE = ['rostlang', 'websynth', 'flappy', 'kthfsdv', 'rustbrowser', 'stbernand', 'devilscript', 'markov', 'platformer', 'snake'];

const card = id => {
    const start = page.indexOf(`data-project="${id}"`);
    return page.slice(start, page.indexOf('class="timeline-row', start + 1) > 0 ? page.indexOf('class="timeline-row', start + 1) : page.indexOf('</main>'));
};

test('exactly the projects that can run in a browser are marked runnable', () => {
    const marked = projects.filter(project => project.run).map(project => project.id);
    assert.deepEqual(marked.sort(), [...RUNNABLE].sort());
});

test('every runnable card has a run button that also works as a plain link', () => {
    for (const id of RUNNABLE) {
        const html = card(id);
        const src = projects.find(project => project.id === id).run.src;
        assert(html.includes(`class="run-button"`), `${id} has no run button`);
        assert(html.includes(`href="${src}"`) && html.includes(`data-run="${src}"`), `${id} run button points at ${src}`);
        assert(html.includes('run-cover'), `${id} has no play overlay on its image`);
    }
});

test('cards that cannot run have no run button', () => {
    for (const project of projects.filter(project => project.year && !project.run)) {
        assert(!card(project.id).includes('run-button'), `${project.id} should not be runnable`);
    }
});

test('every run target exists in the built site', () => {
    for (const project of projects.filter(project => project.run)) {
        const file = path.join(site, project.run.src, 'index.html');
        assert(fs.existsSync(file), `${project.run.src} is missing`);
    }
});

test('the page has one modal, and its frame loads nothing until opened', () => {
    assert.equal((page.match(/<dialog/g) || []).length, 1);
    const dialog = page.slice(page.indexOf('<dialog'), page.indexOf('</dialog>'));
    assert.match(dialog, /<iframe[^>]*id="run-frame"/);
    assert(!/<iframe[^>]*\ssrc=/.test(dialog), 'the frame must not have a src in the markup');
    assert(page.includes('src="./run.js'), 'the modal script is loaded');
});

test('the modal script ships only on the projects page', () => {
    assert(!fs.readFileSync(path.join(site, 'index.html'), 'utf8').includes('run.js'));
});
