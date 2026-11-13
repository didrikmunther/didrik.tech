const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const imageSize = require('../src/_helpers/imageSize');

const root = path.resolve(__dirname, '..');
const site = path.join(root, 'dist/en');
const page = fs.readFileSync(path.join(site, 'projects/index.html'), 'utf8');
const html = page.slice(page.indexOf('class="timeline relative'), page.indexOf('</main>'));

// Ground truth read with ffprobe, independent of the parser under test.
const known = {
    'static/flappy.webp': [972, 1228],
    'static/kthformulastudent.webp': [1928, 1000],
    'static/rustlang.webp': [876, 290],
    'static/blog/calliq/calliq-scam-call-warning.jpg': [1600, 1120]
};

test('the image header parser reads webp and jpeg dimensions', () => {
    for (const [file, [width, height]] of Object.entries(known)) {
        assert.deepEqual(imageSize(path.join(root, file)), { width, height }, file);
    }
});

test('every timeline image declares the size it actually is', () => {
    const images = [...html.matchAll(/<img[^>]*>/g)].map(match => match[0]);
    assert.equal(images.length, 12);
    for (const image of images) {
        const src = image.match(/src="\.\/([^"]+)"/)[1];
        const width = Number(image.match(/width="(\d+)"/)[1]);
        const height = Number(image.match(/height="(\d+)"/)[1]);
        assert.deepEqual({ width, height }, imageSize(path.join(site, src)), src);
    }
});

test('only the images below the fold are lazy-loaded', () => {
    const images = [...html.matchAll(/<img[^>]*>/g)].map(match => match[0]);
    assert(!images[0].includes('loading="lazy"'), 'the first card is above the fold');
    for (const image of images.slice(1)) {
        assert(image.includes('loading="lazy"'), image);
    }
});
