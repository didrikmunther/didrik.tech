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
