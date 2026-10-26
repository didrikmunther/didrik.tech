const getYaml = require('../_helpers/getYalm');

module.exports = async (site, cb) => {
    try {
        const [{ languages }, { translation }] = await Promise.all([
            getYaml('../data/languages.yaml'),
            getYaml('../data/translation.yaml')
        ]);
        const current = languages[translation.current];
        const primaryOrigin = languages.se.siteUrl;
        const publicLanguages = Object.values(languages).filter(language => !language.hidden);
        const absoluteUrl = (path, origin) => new URL(path, origin).href;

        const pages = site.map(page => {
            if (!page.url.endsWith('/')) return page;

            // Blog content is English and shared across language shells and Firebase mirrors.
            const isBlog = page.url.startsWith('/blog/');
            const isPost = Boolean(page.postTitle);
            const origin = isBlog ? primaryOrigin : current.siteUrl;
            const canonicalUrl = absoluteUrl(page.url, origin);
            const featuredImages = [page.coverImg, ...(page.album || []).map(image => image.src)]
                .filter(Boolean).map(image => absoluteUrl(image, origin));
            const images = [...new Set([
                ...featuredImages,
                ...(page.sitemapImages || []).map(image => absoluteUrl(image, origin))
            ])];
            const language = isBlog ? 'en' : current.code;
            const description = page.description || 'Didrik Munther IT & Datakonsult AB';
            const article = isPost ? {
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
                    url: primaryOrigin + '/',
                    image: absoluteUrl(page.authorImg, primaryOrigin)
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
                    alternates: isBlog || current.hidden ? [] : [
                        ...publicLanguages.map(language => ({
                            language: language.code,
                            url: absoluteUrl(page.url, language.siteUrl)
                        })),
                        { language: 'x-default', url: absoluteUrl(page.url, primaryOrigin) }
                    ],
                    // Keep content such as </script> inside the JSON-LD data block.
                    articleJson: article ? JSON.stringify(article).replace(/</g, '\\u003c') : null
                }
            };
        });

        const sitemapEntries = pages
            .filter(page => page.seo && page.sitemap !== false &&
                new URL(page.seo.canonicalUrl).origin === current.siteUrl)
            .map(page => ({
                url: page.seo.canonicalUrl,
                lastmod: page.dateModified || page.datePublished,
                images: page.seo.images
            }));

        cb(null, pages.map(page => ({ ...page, siteUrl: current.siteUrl, sitemapEntries })));
    } catch (error) {
        cb(error);
    }
};
