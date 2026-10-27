# didrik.tech

This is the static page generator code for the webpage <http://didrik.tech>.

Hosting is done with firebase.

Run `npm test` to build all three languages and check canonical URLs, article metadata,
image references, and sitemaps. This does not deploy the site.

SEO metadata is assembled in `src/helpers/seo.js`. Public origins and language codes
live in `src/data/languages.yaml`; hidden languages are omitted from language alternatives.
The shared English blog uses `didrik.tech` as its canonical host, while translated
pages use their language's origin. Each build generates its own `robots.txt` and
`sitemap.xml`, containing only that host's canonical pages.

Blog front matter supplies `description`, `coverImgAlt`, ISO `datePublished` and
`dateModified` values, and album entries with `src` and `alt`. Cover and album images
are included automatically; use `sitemapImages` for additional images embedded in
the article. Update modification dates when content changes, not on every build.

Code blocks in Markdown are highlighted at build time with Shiki by `src/code/highlight.mjs`,
so pages load no highlighting script. Fences can use any language Shiki bundles. To add another
language, put its TextMate grammar in `src/code/grammars/<language>.tmLanguage.json`; the Rost
grammar there is copied from the Rost VS Code extension.
