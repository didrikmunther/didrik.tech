const hljs = require('highlight.js');

// static-site renders Markdown fences with highlight.js, which throws on languages it doesn't
// know, such as ```rost (or ```text in highlight.js 9). src/code/highlight.mjs replaces that
// output with Shiki's anyway, so render unknown fence languages as plain text here.
const highlight = hljs.highlight;
hljs.highlight = (language, ...args) =>
    highlight.call(hljs, hljs.getLanguage(language) ? language : 'plaintext', ...args);

module.exports = (site, cb) => cb(null, site);
