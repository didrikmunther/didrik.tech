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
    assert.equal(dated.length, 18);
    const years = dated.map(project => Number(project.year));
    assert.deepEqual(years, [2026, 2025, 2025, 2024, 2023, 2022, 2020, 2020, 2019, 2018, 2018, 2018, 2018, 2016, 2015, 2015, 2014, 2013]);
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

const column = name => {
    const start = html.indexOf(`tl-col tl-col-${name}`);
    return html.slice(start, html.indexOf('tl-col tl-col-', start + 1) >= 0 && name === 'left'
        ? html.indexOf('tl-col tl-col-', start + 1)
        : html.indexOf('</div>\n      </div>', start));
};

test('the dated cards are split into two columns, alternating by date', () => {
    const dated = projects.filter(project => project.id !== 'more');
    const ids = side => [...column(side).matchAll(/data-project="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(ids('left'), dated.filter((_, index) => index % 2 === 0).map(project => project.id));
    assert.deepEqual(ids('right'), dated.filter((_, index) => index % 2 === 1).map(project => project.id));
});

test('every card carries its place in the date order, so one column can stack on phones', () => {
    const orders = [...html.matchAll(/class="timeline-row[^"]*"[^>]*style="order: (\d+)"/g)].map(match => Number(match[1]));
    assert.deepEqual(orders.sort((a, b) => a - b), [...Array(18).keys()]);
});

test('the year sits inside the card, above the title', () => {
    assert.equal((html.match(/tl-year-inline/g) || []).length, 18);
    const card = html.slice(html.indexOf('tl-year-inline'));
    assert(card.indexOf('<h2') > 0 && card.indexOf('<h2') < card.indexOf('</div>'), 'the year precedes the heading');
});

test('the closing card sits below both columns, outside them', () => {
    assert(html.indexOf('timeline-closing') > html.indexOf('tl-col tl-col-right'));
    assert(html.indexOf('timeline-closing') > html.lastIndexOf('timeline-card'));
});

test('each dated row has one dot and one visible year', () => {
    const rows = html.split('class="timeline-row').slice(1);
    assert.equal(rows.length, 18);
    for (const row of rows) {
        assert.equal((row.match(/timeline-dot/g) || []).length, 1);
        assert.match(row, /tl-year-inline[^>]*>\s*\d{4}/);
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
    assert.equal((html.match(/timeline-tech/g) || []).length, 18);
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

test('titles are escaped, not injected as markup', () => {
    // "Nya Hjul & Däckorder" is the live canary: with the safe filter gone the
    // ampersand arrives as an entity, and a title carrying a quote or an angle
    // bracket can no longer close the alt attribute or vanish into a tag.
    assert(html.includes('Nya Hjul &amp; D'), 'the ampersand must be escaped');
    assert(!html.includes('title|safe'));
    const timeline = html.slice(html.indexOf('class="timeline relative'), html.indexOf('</main>'));
    const alts = [...timeline.matchAll(/alt="([^"]*)"/g)].map(match => match[1]);
    assert.equal(alts.length, 18);
    for (const alt of alts) assert(!alt.includes('<'), alt);
});

test('text that can run long gets a direction and a break opportunity', () => {
    assert((html.match(/dir="auto"/g) || []).length >= 18, 'headings carry dir="auto"');
});

test('a project without an image renders no image element at all', () => {
    assert(!html.includes('<img src=""'));
    assert(!html.includes('width=""'));
});

test('every dated project carries the fields the card needs', () => {
    for (const project of projects.filter(project => project.id !== 'more')) {
        for (const field of ['title', 'year', 'url', 'text', 'img']) {
            assert(project[field] !== undefined, `${project.id} is missing ${field}`);
        }
        assert.match(String(project.year), /^\d{4}$/);
        assert(project.title.length <= 60, `${project.id} has a title of ${project.title.length} characters`);
        assert(project.text.length > 0, `${project.id} has no description`);
    }
});

test('the Miking LSP card links to its repo and the thesis', () => {
    const start = html.indexOf('data-project="mikinglsp"');
    const card = html.slice(start, html.indexOf('class="timeline-row', start + 1));
    assert(card.includes('href="https://github.com/didrikmunther/miking-lsp-demo"'), 'repo link');
    assert(card.includes('href="https://kth.diva-portal.org/smash/record.jsf?pid=diva2:1957912"'), 'thesis link');
    assert(card.includes('href="https://marketplace.visualstudio.com/items?itemName=didrikmunther.mcore"'), 'extension link kept');
});
