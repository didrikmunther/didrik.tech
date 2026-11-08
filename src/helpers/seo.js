const getYaml = require('../_helpers/getYalm');

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

        const sitemapEntries = pages
            .filter(page => page.seo && page.sitemap !== false)
            .map(page => ({
                url: page.seo.canonicalUrl,
                lastmod: page.dateModified || page.datePublished,
                images: page.seo.images
            }));

        cb(null, pages.map(page => ({ ...page, siteUrl, sitemapEntries })));
    } catch (error) {
        cb(error);
    }
};
