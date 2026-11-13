const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const site = path.join(root, 'dist/en');
const projects = YAML.parse(fs.readFileSync(path.join(root, 'src/data/projects.yaml'), 'utf8')).projects;

test('every project but the closing one is dated, newest first', () => {
    const dated = projects.filter(project => project.id !== 'more');
    assert.equal(dated.length, 12);
    const years = dated.map(project => Number(project.year));
    assert.deepEqual(years, [2026, 2025, 2025, 2024, 2022, 2020, 2020, 2018, 2018, 2018, 2018, 2014]);
});

test('the closing GitHub card has no year, image or tech', () => {
    const closing = projects[projects.length - 1];
    assert.equal(closing.id, 'more');
    for (const field of ['year', 'img', 'tech']) assert.equal(closing[field], undefined);
    assert.match(closing.url, /github\.com\/didrikmunther/);
});

test('every project image exists in the built site', () => {
    for (const project of projects.filter(project => project.img)) {
        const file = project.img.replace(/^\.?\//, '');
        assert(fs.existsSync(path.join(site, file)), `${project.img} is missing`);
    }
});

test('projects linking to a blog post stay in the same tab', () => {
    const posts = projects.filter(project => project.url.startsWith('/blog/'));
    assert.equal(posts.length, 3, 'the three hackathon projects link to their posts');
    for (const project of posts) {
        assert.equal(project.target, undefined, `${project.id} links to a post on this site`);
    }
});

const html = fs.readFileSync(path.join(site, 'projects/index.html'), 'utf8');

test('rows alternate sides down the line', () => {
    const sides = [...html.matchAll(/timeline-row timeline-(left|right)/g)].map(match => match[1]);
    assert.equal(sides.length, 12);
    sides.forEach((side, index) => assert.equal(side, index % 2 === 0 ? 'left' : 'right'));
});

test('each dated row has one dot and one visible year', () => {
    const rows = html.split('timeline-row').slice(1, 13);
    assert.equal(rows.length, 12);
    for (const row of rows) {
        assert.equal((row.match(/timeline-dot/g) || []).length, 1);
        assert.match(row, /timeline-year[^>]*>\s*\d{4}/);
    }
});

test('the Third card keeps its link description wiring', () => {
    assert(html.includes('aria-describedby="project-platformer-description"'));
    assert(html.includes('id="project-platformer-description"'));
});

test('the closing card renders without a dot, year, image or tech element', () => {
    assert(html.includes('timeline-closing'));
    const closing = html.slice(html.indexOf('timeline-closing'), html.indexOf('</main>'));
    for (const marker of ['timeline-dot', 'timeline-year', 'timeline-tech', '<img'])
        assert(!closing.includes(marker), `the closing card must not contain ${marker}`);
});

test('no project renders an empty tech element', () => {
    assert.equal((html.match(/timeline-tech/g) || []).length, 12);
    assert(!/timeline-tech[^>]*>\s*</.test(html));
});

test('every project paragraph is text, not a mangled YAML mapping', () => {
    for (const project of projects) {
        for (const paragraph of project.text) {
            assert.equal(typeof paragraph, 'string', `${project.id} has a non-string paragraph`);
        }
    }
    assert(!html.includes('[object Object]'));
});

test('the page has exactly one top-level heading', () => {
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
});

test('no project text points at its neighbour by position', () => {
    for (const project of projects) {
        for (const paragraph of project.text) {
            assert(!/\bthe one (above|below)\b/i.test(paragraph),
                `${project.id} refers to a neighbour by position, which the timeline order changes`);
        }
    }
});
