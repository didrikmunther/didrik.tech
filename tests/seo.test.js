const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const origin = 'https://didrik.tech';
const posts = fs.readdirSync(path.join(root, 'src/html/blog'))
    .filter(file => file.endsWith('.md'))
    .map(file => path.basename(file, '.md'));
const urls = ['/', '/projects/', '/contact/', '/blog/', ...posts.map(post => `/blog/${post}/`)];
const site = path.join(root, 'dist/en');
const read = file => fs.readFileSync(path.join(site, file), 'utf8');
const readPage = url => read(url + 'index.html');
const head = html => html.match(/<head>([\s\S]*?)<\/head>/)[1];
const canonical = html => {
    const matches = [...head(html).matchAll(/<link rel="canonical" href="([^"]+)">/g)];
    assert.equal(matches.length, 1);
    return matches[0][1];
};
const article = html => {
    const matches = [...head(html).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.equal(matches.length, 1);
    return JSON.parse(matches[0][1]);
};

test('pages are English and canonical on didrik.tech, without language alternatives', () => {
    for (const url of urls) {
        const html = readPage(url);
        assert.equal(canonical(html), origin + url);
        assert(html.includes('<html lang="en">'));
        assert(!head(html).includes('hreflang'), `${url} must not list other language versions`);
    }
});

test('article and image metadata refer to real assets and the canonical author', () => {
    for (const post of posts) {
        const html = readPage(`/blog/${post}/`);
        const data = article(html);
        assert.equal(data['@type'], 'BlogPosting');
        assert.equal(data['@context'], 'https://schema.org');
        assert.equal(data.url, canonical(html));
        assert.equal(data.mainEntityOfPage['@id'], canonical(html));
        assert.equal(data.inLanguage, 'en');
        assert.equal(data.author['@type'], 'Person');
        assert.equal(data.author.name, 'Didrik Munther');
        assert.equal(data.author.url, origin + '/');
        assert(data.description.length > 50);
        assert.match(data.datePublished, /^\d{4}-\d{2}-\d{2}$/);
        assert(Date.parse(data.dateModified) >= Date.parse(data.datePublished));
        for (const image of [...data.image, data.author.image]) {
            assert.equal(new URL(image).origin, origin);
            assert(fs.existsSync(path.join(site, new URL(image).pathname)));
        }
        assert(head(html).includes(`<meta property="og:url" content="${canonical(html)}">`));
        assert(head(html).includes(`<meta property="og:image" content="${data.image[0]}">`));
        const images = html.match(/<img\b[^>]*>/g);
        const cover = images.find(image => image.includes('class="jarallax-img'));
        assert.match(cover, /alt="[^"]+"/);
        if (post === 'strawberry-launch') assert(cover.includes('Didrik Munther'));
        if (post === 'generact') {
            assert(cover.includes('Visual Studio Code'));
            assert(!cover.includes('Didrik Munther'));
            for (const photo of ['all.jpg', 'stage.jpg']) {
                assert(images.find(image => image.includes(photo)).includes('alt="Didrik Munther'));
            }
            assert.equal(data.image.length, 3);
        }
    }
    const listing = readPage('/blog/');
    const cardImages = listing.match(/<img\b[^>]*class="[^"]*post-bg[^>]*>/g);
    assert.equal(cardImages.length, posts.length, 'Blog cards must expose crawlable image elements');
});

test('robots and sitemap advertise every canonical page', () => {
    assert.equal(read('robots.txt').trim(), `Sitemap: ${origin}/sitemap.xml`);
    const sitemap = read('sitemap.xml');
    assert(sitemap.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'));
    const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(match => match[1]);
    const locations = entries.map(entry => entry.match(/<loc>([^<]+)<\/loc>/)[1]);
    assert.deepEqual(locations.sort(), urls.map(url => origin + url).sort());
    for (const entry of entries) {
        const url = entry.match(/<loc>([^<]+)<\/loc>/)[1];
        const html = readPage(new URL(url).pathname);
        assert.equal(canonical(html), url);
        if (posts.some(post => url.endsWith(`/blog/${post}/`))) {
            const images = [...entry.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map(match => match[1]);
            for (const image of article(html).image) {
                assert(images.includes(image), 'Sitemap must include the article images');
            }
            assert.equal(new Set(images).size, images.length);
            for (const image of images) {
                const imageUrl = new URL(image);
                assert.equal(imageUrl.origin, origin);
                assert(html.includes(imageUrl.pathname), 'Sitemap images must be present in the article');
            }
            assert(entry.includes(`<lastmod>${article(html).dateModified}</lastmod>`));
        }
    }
});

test('article JSON-LD preserves titles without allowing a closing script tag', async () => {
    const headline = 'A <Generate> example: </script><script>alert("test")</script>';
    const pages = await new Promise((resolve, reject) => require('../src/helpers/seo')([{
        url: '/blog/escaping-example/',
        postTitle: headline,
        author: 'Didrik Munther',
        authorImg: '/static/didrik-closeup.jpg',
        coverImg: '/static/blog/generact/generact.webp'
    }], (error, result) => error ? reject(error) : resolve(result)));
    assert(!pages[0].seo.articleJson.includes('<'));
    assert.equal(JSON.parse(pages[0].seo.articleJson).headline, headline);
});
