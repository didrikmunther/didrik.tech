const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const origins = {
    se: 'https://didrik.tech',
    en: 'https://en.didrik.tech'
};
const posts = fs.readdirSync(path.join(root, 'src/html/blog'))
    .filter(file => file.endsWith('.md'))
    .map(file => path.basename(file, '.md'));
const read = (language, file) => fs.readFileSync(path.join(root, 'dist', language, file), 'utf8');
const readPage = (language, url) => read(language, url + 'index.html');
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

for (const [language, origin] of Object.entries(origins)) {
    test(`${language}: canonicals and language alternatives agree across the build`, () => {
        for (const url of ['/', '/projekt/', '/kontakt/', '/blog/', ...posts.map(post => `/blog/${post}/`)]) {
            const html = readPage(language, url);
            const blog = url.startsWith('/blog/');
            assert.equal(canonical(html), (blog ? origins.se : origin) + url);
            const expectedLanguage = blog ? 'en' : language === 'se' ? 'sv' : language;
            assert(html.includes(`<html lang="${expectedLanguage}">`));
            const alternates = [...head(html).matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)]
                .map(match => [match[1], match[2]]);
            assert.deepEqual(alternates, blog ? [] : [
                ['sv', origins.se + url], ['en', origins.en + url], ['x-default', origins.se + url]
            ]);
        }
    });

    test(`${language}: article and image metadata refer to real assets and the canonical author`, () => {
        for (const post of posts) {
            const html = readPage(language, `/blog/${post}/`);
            const data = article(html);
            assert.equal(data['@type'], 'BlogPosting');
            assert.equal(data['@context'], 'https://schema.org');
            assert.equal(data.url, canonical(html));
            assert.equal(data.mainEntityOfPage['@id'], canonical(html));
            assert.equal(data.inLanguage, 'en');
            assert.equal(data.author['@type'], 'Person');
            assert.equal(data.author.name, 'Didrik Munther');
            assert.equal(data.author.url, origins.se + '/');
            assert(data.description.length > 50);
            assert.match(data.datePublished, /^\d{4}-\d{2}-\d{2}$/);
            assert(Date.parse(data.dateModified) >= Date.parse(data.datePublished));
            for (const image of [...data.image, data.author.image]) {
                assert.equal(new URL(image).origin, origins.se);
                assert(fs.existsSync(path.join(root, 'dist', language, new URL(image).pathname)));
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
        const listing = readPage(language, '/blog/');
        const cardImages = listing.match(/<img\b[^>]*class="[^"]*post-bg[^>]*>/g);
        assert.equal(cardImages.length, posts.length, 'Blog cards must expose crawlable image elements');
    });

    test(`${language}: robots and sitemap advertise only this host's canonical pages`, () => {
        assert.equal(read(language, 'robots.txt').trim(), `Sitemap: ${origin}/sitemap.xml`);
        const sitemap = read(language, 'sitemap.xml');
        assert(sitemap.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'));
        const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(match => match[1]);
        const locations = entries.map(entry => entry.match(/<loc>([^<]+)<\/loc>/)[1]);
        const expected = ['/', '/projekt/', '/kontakt/'];
        if (language === 'se') expected.push('/blog/', ...posts.map(post => `/blog/${post}/`));
        assert.deepEqual(locations.sort(), expected.map(url => origin + url).sort());
        for (const entry of entries) {
            const url = entry.match(/<loc>([^<]+)<\/loc>/)[1];
            const html = readPage(language, new URL(url).pathname);
            assert.equal(canonical(html), url);
            if (posts.some(post => url.endsWith(`/blog/${post}/`))) {
                const images = [...entry.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map(match => match[1]);
                for (const image of article(html).image) {
                    assert(images.includes(image), 'Sitemap must include the article images');
                }
                assert.equal(new Set(images).size, images.length);
                for (const image of images) {
                    const imageUrl = new URL(image);
                    assert.equal(imageUrl.origin, origins.se);
                    assert(html.includes(imageUrl.pathname), 'Sitemap images must be present in the article');
                }
                assert(entry.includes(`<lastmod>${article(html).dateModified}</lastmod>`));
            }
        }
    });
}

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
