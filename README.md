# didrik.tech

This is the static page generator code for the webpage <http://didrik.tech>.

Hosting is done with firebase. The site is in English: `deploy.sh` builds it into
`../dist/en`, which Firebase serves at didrik.tech. The Firebase config is in the
didrik.tech.firebase repo, which includes this repo as a submodule. It redirects
en.didrik.tech and the old Swedish paths `/projekt` and `/kontakt` to the English
pages, so update it when moving pages.

Run `npm test` to build the site and check canonical URLs, article metadata,
image references, and the sitemap. This does not deploy the site.

SEO metadata is assembled in `src/helpers/seo.js`. The site's public origin and
language code live in `src/data/languages.yaml`. The build generates `robots.txt`
and a `sitemap.xml` listing every canonical page.

Blog front matter supplies `description`, `coverImgAlt`, ISO `datePublished` and
`dateModified` values, and album entries with `src` and `alt`. Cover and album images
are included automatically; use `sitemapImages` for additional images embedded in
the article. Update modification dates when content changes, not on every build.

Code blocks in Markdown are highlighted at build time with Shiki by `src/code/highlight.mjs`,
so pages load no highlighting script. Fences can use any language Shiki bundles. To add another
language, put its TextMate grammar in `src/code/grammars/<language>.tmLanguage.json`; the Rost
grammar there is copied from the Rost VS Code extension.

Third is hosted at `/third/`, following the other standalone demos in `meta/`.
Its browser page and WebAssembly build are in `meta/third/` and are copied to
the site's output by the existing build. The game starts after clicking
Play and requires a keyboard and mouse. No game server is needed.

The build is based on [Third](https://github.com/didrikmunther/Third), commit
`4a3590e`, compiled with Emscripten 6.0.13 and bundled with the Skygarden Keep
map. When updating the compiled game, replace `index.js`, `index.wasm` and
`index.data` together, preserving the site's `index.html` wrapper. Serve `.wasm`
as `application/wasm`; assets resolve relative to `/third/`. The roughly 20 MB
game download is confined to the game page, not the article or projects listing.
