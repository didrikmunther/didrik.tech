const { execFileSync } = require('child_process');
const path = require('path');

const getYaml = require('../_helpers/getYalm');

const root = path.join(__dirname, '../..');

// Pages without dates in their front matter take the date of the last commit
// that touched their sources, so the sitemap's lastmod follows real edits.
const pageSources = {
    '/': ['src/html/index.html', 'src/pages/index.html'],
    '/blog/': ['src/html/blog.html', 'src/pages/blog.html'],
    '/contact/': ['src/html/contact.html', 'src/pages/contact.html'],
    '/projects/': ['src/html/projects.html', 'src/pages/projects.html', 'src/data/projects.yaml']
};

// Returns YYYY-MM-DD, or undefined when git history is unavailable. A shallow
// clone would date every page to its single commit, so treat that as unknown.
const gitDate = files => {
    try {
        const run = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
        if (run(['rev-parse', '--is-shallow-repository']) === 'true') return undefined;
        return run(['log', '-1', '--format=%cs', '--', ...files]) || undefined;
    } catch (error) {
        return undefined;
    }
};

const newest = dates => dates.filter(Boolean).sort().pop();

module.exports = async (site, cb) => {
    try {
        const [{ languages }, { translation }] = await Promise.all([
            getYaml('../data/languages.yaml'),
            getYaml('../data/translation.yaml')
        ]);
        const { code: language, siteUrl } = languages[translation.current];
        const absoluteUrl = path => new URL(path, siteUrl).href;

        const pages = site.map(page => {
            if (!page.url.endsWith('/')) return page;

            const canonicalUrl = absoluteUrl(page.url);
            const featuredImages = [page.coverImg, ...(page.album || []).map(image => image.src)]
                .filter(Boolean).map(image => absoluteUrl(image));
            const images = [...new Set([
                ...featuredImages,
                ...(page.sitemapImages || []).map(image => absoluteUrl(image))
            ])];
            const description = page.description || 'Didrik Munther IT & Datakonsult AB';
            const article = page.postTitle ? {
                '@context': 'https://schema.org',
                '@type': 'BlogPosting',
                headline: page.postTitle,
                description,
                url: canonicalUrl,
                mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
                inLanguage: language,
                image: featuredImages,
                datePublished: page.datePublished,
                dateModified: page.dateModified,
                author: {
                    '@type': 'Person',
                    name: page.author,
                    url: siteUrl + '/',
                    image: absoluteUrl(page.authorImg)
                }
            } : null;

            return {
                ...page,
                seo: {
                    canonicalUrl,
                    language,
                    description,
                    imageUrl: featuredImages[0],
                    images,
                    // Keep content such as </script> inside the JSON-LD data block.
                    articleJson: article ? JSON.stringify(article).replace(/</g, '\\u003c') : null
                }
            };
        });

        const postDates = pages
            .filter(page => page.postTitle)
            .map(page => page.dateModified || page.datePublished);
        const fallbackLastmod = page => {
            const sources = pageSources[page.url];
            if (!sources) return undefined;
            // The blog listing changes whenever a post does.
            if (page.url === '/blog/') return newest([...postDates, gitDate(sources)]);
            return gitDate(sources);
        };

        const sitemapEntries = pages
            .filter(page => page.seo && page.sitemap !== false)
            .map(page => ({
                url: page.seo.canonicalUrl,
                lastmod: page.dateModified || page.datePublished || fallbackLastmod(page),
                images: page.seo.images
            }));

        cb(null, pages.map(page => ({ ...page, siteUrl, sitemapEntries })));
    } catch (error) {
        cb(error);
    }
};
