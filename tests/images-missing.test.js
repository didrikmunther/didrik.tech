const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');

const imageSize = require('../src/_helpers/imageSize');
const { withImageSize } = require('../src/helpers/projects');

const root = path.resolve(__dirname, '..');

test('an unreadable image does not take the whole build down', () => {
    // A path typo or an .svg in projects.yaml used to throw out of the helper,
    // which fails every page, not just the card that named it.
    const project = withImageSize({ id: 'bad', title: 'Broken', img: './static/nope.webp' });
    assert.equal(project.imgWidth, undefined);
    assert.equal(project.imgHeight, undefined);
    assert.equal(project.title, 'Broken');
});

test('a readable image still gets its real dimensions', () => {
    const project = withImageSize({ id: 'ok', img: './static/rustlang.webp' });
    assert.deepEqual([project.imgWidth, project.imgHeight], [876, 290]);
});

test('the parser rejects a format it cannot read, loudly', () => {
    assert.throws(() => imageSize(path.join(root, 'static/logo_svg.svg')), /Unrecognised image format/);
});
