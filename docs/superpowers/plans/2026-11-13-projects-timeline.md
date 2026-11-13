# Projects Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the projects page into a dated vertical timeline: a red centre line, cards alternating left and right, newest year first, with two projects added from GitHub.

**Architecture:** Data stays in `src/data/projects.yaml` and gains `year` and `tech` fields; `src/pages/projects.html` is rewritten as timeline rows; the line, dots and alternation live as custom classes in `src/style/style.css` next to the site's other custom CSS. A new `tests/projects.test.js` asserts the rendered page against `dist/en/projects/index.html`, the way `tests/seo.test.js` does.

**Tech Stack:** Node static-site generator (Nunjucks-style templates), Tailwind 1.x via PostCSS with `purge` over `src/**/*.{html,yaml,md}`, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-13-projects-timeline-design.md`

## Global Constraints

- Years are start years only, no ranges: Optimera 2026, CalliQ 2025, Generact 2025, Miking LSP 2024, Rost 2022, Web Audio API Synth 2020, Flappy Bird AI 2020, Rust browser engine 2018, KTH Formula Student 2018, Nya Hjul & Däckorder 2018, Valla Däck 2018, 2-D Platformer Engine 2014.
- Order is newest first; within a year, the more recent work first.
- `npm test` runs a full production build then every test file; it must pass at the end of each task.
- Images live in `static/` as `.webp`. Convert with `cwebp -q 85`.
- Keep the site's existing look: `bg-gray-800` section, `bg-red-800` cards, white text, the diagonal `svg` divider at the top of the section.
- Do not touch any page other than the projects page.
- No JavaScript is added to the page.

## Review Focus

- A project without `tech` (the closing GitHub card) must render no empty tech element.
- The closing "More projects on GitHub" card has no `year` and no `img`: it must render no dot label and no broken `<img>`.
- The three hackathon entries link to blog posts on this site, not to external URLs: their links must have no `target="_blank"`.
- Four projects share the year 2018: each still gets its own dot and year, and the left/right alternation continues across them.
- `linkDescription` (on the Third card) must still render with its `aria-describedby` wiring intact.
- Long titles such as "Nya Hjul & Däckorder" must wrap inside the card rather than overflow it.

---

### Task 1: Images for the two new projects

**Files:**
- Create: `static/mikinglsp.webp`
- Create: `static/rustbrowser.webp`

**Interfaces:**
- Produces: two `.webp` files under `static/`, referenced by Task 2 as `./static/mikinglsp.webp` and `./static/rustbrowser.webp`.

- [ ] **Step 1: Fetch the Miking LSP screenshot**

```bash
gh api repos/didrikmunther/miking-lsp-demo/contents/docs/mikinglspdemo.png --jq .content \
  | base64 -d > "$TMPDIR/mikinglsp.png"
```

- [ ] **Step 2: Convert it**

```bash
cwebp -q 85 "$TMPDIR/mikinglsp.png" -o static/mikinglsp.webp
```

Expected: the file exists and is under 400 kB, in line with the other images in `static/`.

- [ ] **Step 3: Build the Rust browser engine and capture its parse output**

```bash
git clone https://github.com/didrikmunther/Rust_browser_engine.git "$TMPDIR/rbe"
```

Replace `$TMPDIR/rbe/example/index.html` with a short, clean document before running
it — the one in the repo contains `version="i want to die"` and must not appear on
the site. Use a small page with a `<head>`, a `<style>` rule and one styled
paragraph, so the printed tree shows elements, attributes and text. Then
`cd "$TMPDIR/rbe" && cargo run` and keep the printed tree.

- [ ] **Step 4: Render the image**

Write a throwaway HTML page in `$TMPDIR` styled like `static/rustlang.webp`: a dark
terminal panel (background `#1e1e2e`-ish, monospace, light text), the input HTML on
the left and the parsed tree on the right, indented one level per nesting depth.
Screenshot it with Playwright at 1200x750, then `cwebp -q 85` it to
`static/rustbrowser.webp`.

- [ ] **Step 5: Verify both images**

Run: `ls -l static/mikinglsp.webp static/rustbrowser.webp` and open each one.
Expected: both exist, both are legible at the card width (about 550 px wide), and
no placeholder or joke text is visible.

- [ ] **Step 6: Commit**

```bash
git add static/mikinglsp.webp static/rustbrowser.webp
git commit -m "Add images for the Miking LSP and Rust browser engine projects"
```

---

### Task 2: Project data with years

**Files:**
- Modify: `src/data/projects.yaml`
- Create: `tests/projects.test.js`

**Interfaces:**
- Consumes: the two image paths from Task 1.
- Produces: each entry in `projects.yaml` has `title`, `id`, `img`, `url`, `text`, and now `year` (a four-digit string) and optionally `tech` (a short string such as `Rust · WASM`) and `target`. The final entry, `id: more`, has no `year`, no `img` and no `tech`. Task 3 renders these fields.

- [ ] **Step 1: Write the failing test**

Create `tests/projects.test.js`. Load the YAML with
`YAML.parse(fs.readFileSync('src/data/projects.yaml', 'utf8')).projects` — the `yaml`
package is already a dependency, and `src/_helpers/getYalm.js` resolves paths relative
to its own directory, so read the file directly here.

```js
test('every project but the closing one is dated, newest first', () => {
    const dated = projects.filter(project => project.id !== 'more');
    assert.equal(dated.length, 12);
    const years = dated.map(project => Number(project.year));
    assert.deepEqual(years, [2026, 2025, 2025, 2024, 2022, 2020, 2020, 2018, 2018, 2018, 2018, 2014]);
});

test('the closing GitHub card has no year, image or tech', () => {
    const closing = projects[projects.length - 1];
    assert.equal(closing.id, 'more');
    for (const field of ['year', 'img', 'tech']) assert.equal(closing[field], undefined);
    assert.match(closing.url, /github\.com\/didrikmunther/);
});

test('every project image exists in the built site', () => {
    for (const project of projects.filter(project => project.img)) {
        assert(fs.existsSync(path.join(site, project.img.replace(/^\.\//, ''))), project.img);
    }
});
```

`site` is `dist/en`, as in `tests/seo.test.js`.

- [ ] **Step 2: Run it and watch it fail**

Run: `NODE_ENV=production bash build.sh && node --test tests/projects.test.js`
Expected: FAIL, because no project has a `year` yet.

- [ ] **Step 3: Update `src/data/projects.yaml`**

Reorder the existing entries newest first and add `year` and `tech` to each. Add two
new entries in their year positions:

- Miking LSP, `id: mikinglsp`, year 2024, img `./static/mikinglsp.webp`, url
  `https://marketplace.visualstudio.com/items?itemName=didrikmunther.mcore`,
  target `_blank`, tech `Miking · MCore · LSP`. One or two sentences: automatic
  Language Server support for domain-specific languages written in the Miking
  framework, so a DSL gets editor features without writing a language server by hand.
- Rust browser engine, `id: rustbrowser`, year 2018, img `./static/rustbrowser.webp`,
  url `https://github.com/didrikmunther/Rust_browser_engine`, target `_blank`, tech
  `Rust`. One or two sentences: an HTML and CSS parser with a layout engine, written
  in Rust to find out what a browser does between the markup and the pixels.

Tech strings for the existing projects: Valla Däck `Angular · PHP · Klarna`, Nya Hjul
`Angular · PHP`, KTH Formula Student `PHP · MySQL · Directus`, Flappy Bird AI
`TypeScript`, Web Audio API Synth `React · Web Audio`, 2-D Platformer Engine
`C++ · Lua · WebAssembly`, Rost `Rust`. Leave the `more` entry's `year`, `img` and
`tech` unset.

Add the three hackathon projects, each linking to its existing blog post on this
site (no `target`), using the post's cover image:

- Optimera, `id: optimera`, year 2026, img `./static/blog/hackeurope/optimera-dashboard.jpg`,
  url `/blog/hackeurope-optimera/`, tech `OpenTelemetry · Django · React`. Built at
  HackEurope: reads application traces to find slow database queries and asks a
  coding agent to propose a fix.
- CalliQ, `id: calliq`, year 2025, img `./static/blog/calliq/calliq-scam-call-warning.jpg`,
  url `/blog/calliq/`, tech `Python · Azure AI Speech · LangGraph`. Runner-up at the
  SSE Business Lab × Microsoft × KTH AI Society Hackathon: listens to a phone call
  and warns the person when it looks like a scam.
- Generact, `id: generact`, year 2025, img `./static/blog/generact/generact.webp`,
  url `/blog/generact/`, tech `React · TypeScript · VS Code`. Built at the European
  Builders' League: a React preprocessor and VS Code extension that generates
  components from a `<Generate>` tag.

Within 2025 put CalliQ (May) before Generact (February). Within 2020 put the Web
Audio Synth before Flappy Bird AI; within 2018 put the Rust browser engine, then
KTH Formula Student, then Nya Hjul, then Valla Däck.

- [ ] **Step 4: Run the test**

Run: `NODE_ENV=production bash build.sh && node --test tests/projects.test.js`
Expected: PASS, all three tests. The page still renders in its old layout at this
point; that is Task 3's job.

- [ ] **Step 5: Commit**

```bash
git add src/data/projects.yaml tests/projects.test.js
git commit -m "Date every project and add the Miking LSP and Rust browser engine"
```

---

### Task 3: Timeline markup and styling

**Files:**
- Modify: `src/pages/projects.html`
- Modify: `src/style/style.css`
- Test: `tests/projects.test.js`

**Interfaces:**
- Consumes: the `year`, `tech`, `img`, `url`, `target`, `text`, `linkDescription` and `id` fields from Task 2.
- Produces: the rendered page structure the tests assert: one `.timeline-row` per project carrying `data-year`, alternating `.timeline-left` / `.timeline-right`, a `.timeline-dot`, a `.timeline-year`, and a closing `.timeline-closing` card.

- [ ] **Step 1: Add the structural tests**

Append to `tests/projects.test.js`:

```js
test('rows alternate sides down the line', () => {
    const sides = [...html.matchAll(/timeline-row timeline-(left|right)/g)].map(m => m[1]);
    assert.equal(sides.length, 12);
    sides.forEach((side, i) => assert.equal(side, i % 2 === 0 ? 'left' : 'right'));
});

test('each dated row has one dot and one visible year', () => {
    const rows = html.split('timeline-row').slice(1);
    for (const row of rows.slice(0, 12)) {
        assert.equal((row.match(/timeline-dot/g) || []).length, 1);
        assert.match(row, /timeline-year[^>]*>\s*\d{4}/);
    }
});

test('the Third card keeps its link description wiring', () => {
    assert(html.includes('aria-describedby="project-platformer-description"'));
    assert(html.includes('id="project-platformer-description"'));
});

test('the closing card renders without a dot, year, image or tech element', () => {
    const closing = html.slice(html.indexOf('timeline-closing'));
    for (const marker of ['timeline-dot', 'timeline-year', 'timeline-tech', '<img'])
        assert(!closing.includes(marker), `closing card must not contain ${marker}`);
});

test('no project renders an empty tech element', () => {
    assert(!/timeline-tech[^>]*>\s*</.test(html));
});
```

`html` is `fs.readFileSync('dist/en/projects/index.html', 'utf8')`.

- [ ] **Step 2: Run them and watch them fail**

Run: `NODE_ENV=production bash build.sh && node --test tests/projects.test.js`
Expected: FAIL, no `timeline-row` in the output.

- [ ] **Step 3: Rewrite the loop in `src/pages/projects.html`**

Keep the `<section class="... bg-gray-800">` wrapper and the diagonal `svg`. Inside,
wrap the loop in a `.timeline` container. Each project renders as:

```
<div class="timeline-row timeline-{left|right}" data-year="{{project.year}}">
  <div class="timeline-dot"></div>
  <div class="timeline-year">{{project.year}}</div>
  <div class="timeline-card"> image, title, hr, paragraphs, tech, Show project link, linkDescription </div>
</div>
```

Alternate the side with the loop index (`loop.index0 % 2`). Render `timeline-year`,
`timeline-dot` and the `<img>` only when `project.year` is set, and the tech element
only when `project.tech` is set. The last entry (no year) renders as
`<div class="timeline-closing">` holding just the title and the link. Keep the
existing card internals: the `h1`, the `hr`, the paragraph loop, the
`translation.texts.project_show` button and the `linkDescription` paragraph with its
`aria-describedby`.

- [ ] **Step 4: Add the timeline CSS to `src/style/style.css`**

Put it with the other custom classes, before `@tailwind components`. The centre line
is an absolutely positioned pseudo-element on `.timeline`; `.timeline-row` is a flex
row that justifies its card to one side; `.timeline-dot` sits on the line; the year
sits on the opposite side of the dot from the card. Card width is
`calc(50% - 50px)`. Below 768 px, the line moves to the left edge, rows stop
alternating, cards go full width and the year sits above the card. Tailwind's
`purge` only scans `src/**/*.{html,yaml,md}`, so these class names must appear in
`src/pages/projects.html` to survive — they do.

- [ ] **Step 5: Run the whole suite**

Run: `npm test`
Expected: PASS, all test files including `tests/seo.test.js`.

- [ ] **Step 6: Commit**

```bash
git add src/pages/projects.html src/style/style.css tests/projects.test.js
git commit -m "Lay the projects page out as a timeline"
```

---

### Task 4: Visual check

**Files:**
- Modify: whichever of the above needs a fix

**Interfaces:**
- Consumes: the built site in `dist/en`.

- [ ] **Step 1: Serve the built site and screenshot it**

```bash
(cd dist/en && python3 -m http.server 8765 &)
```

Screenshot `http://localhost:8765/projects/` with Playwright full-page at 1280 wide,
and again at 390 wide for mobile.

- [ ] **Step 2: Look at both screenshots**

Check: the line runs unbroken behind every row; years line up with their dots; no
text overflows a card, including "Nya Hjul & Däckorder" and the four 2018 rows; the
closing GitHub card reads as an ending; on mobile every card is full width with its
year above it and nothing is clipped.

- [ ] **Step 3: Fix anything that looks wrong, then re-run `npm test` and re-screenshot**

- [ ] **Step 4: Show the screenshots and commit any fixes**

```bash
git add -A
git commit -m "Polish the projects timeline layout"
```
