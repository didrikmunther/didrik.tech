# Projects page as a timeline

## Intent and why

The projects page is a stack of identical red cards with no sense of time.
Turning it into a timeline lets a visitor see when each project was built and
how the work changed over the years, not just what exists.

## Goals

- Every project sits on a dated timeline, newest at the top.
- The page keeps the site's current look: dark background, red cards, the
  screenshot-plus-text pairing.
- Two projects that are only on GitHub today join the page.

## Non-goals

- No filtering, tags, or sorting controls.
- No animation or scroll effects.
- No change to the blog, front page, or any other page.

## Anti-goals

- A timeline so sparse that the gaps between years look like idle periods.
- Losing the screenshots: they are what makes the page worth scrolling.

## Constraints

- Static site generator: data in `src/data/projects.yaml`, markup in
  `src/pages/projects.html`, styling with the project's Tailwind setup.
- `npm test` checks canonical URLs, image references, and the sitemap; it must
  pass.
- Images live in `static/` as `.webp`.

## Approaches

Three were mocked up and screenshotted in the real site chrome:

- **A, centre spine with alternating cards** (chosen). A red vertical line down
  the middle, projects alternating left and right, year beside each dot, each
  project a red card with its screenshot on top. Keeps today's visual weight and
  the large screenshots. Costs vertical length: roughly one screen per project.
- **B, compact left-rail list.** Years in a left column, each project one short
  row. All projects fit on about one screen and it adapts to phones easily, but
  it drops the site's bold red styling and shrinks the screenshots.
- **C, horizontal year axis with one featured project.** Most striking, but
  visitors must click through, so most would see only the first project.

Didrik picked A: the page is for showing off a handful of projects, and the
screenshots carry it.

## The design

**Order.** Newest first, descending by year. Within a year, most recent work
first.

**Years**, confirmed from GitHub history and Didrik's own corrections:

| Year | Project |
|------|---------|
| 2026 | Optimera (HackEurope) |
| 2025 | CalliQ (SSE Business Lab Hackathon) |
| 2025 | Generact (European Builders' League) |
| 2024 | Miking LSP |
| 2022 | Programming language (Rost) |
| 2020 | Web Audio API Synth |
| 2020 | Flappy Bird AI |
| 2018 | Rust browser engine |
| 2018 | KTH Formula Student |
| 2018 | Nya Hjul & Däckorder |
| 2018 | Valla Däck |
| 2014 | 2-D Platformer Engine (Third) |

Start years only, no ranges.

**Layout.** A red vertical line down the centre of the dark section. Each
project is a red card on alternating sides, its screenshot above the text, with
a dot on the line and the year in large type on the opposite side of the dot.
The existing diagonal `svg` divider at the top of the section stays.

**New per-project fields in `projects.yaml`:** `year` (required) and `tech` (an
optional short list such as `Rust · WASM`), shown as small uppercase text above
the Show project button. My call: `tech` adds useful information at a glance and
was in the mockup Didrik approved.

**Closing entry.** "More projects on GitHub" becomes a final card at the bottom
of the line with no year and no screenshot, so it reads as an ending rather than
as a dated project. My call.

**Mobile.** Below `md`, the line moves to the left edge and all cards stack in
one column at full width, year above each card. The current page already
collapses to one column.

**Hackathon projects** (added by Didrik during implementation). The three
hackathon projects already have blog posts and cover images on the site, so each
becomes a timeline entry linking to its post: Optimera at HackEurope (2026),
CalliQ at the SSE Business Lab Hackathon (2025, runner-up), and Generact at the
European Builders' League (2025). They also fill what would otherwise be an empty
stretch between 2022 and 2026.

**Two new projects**, with text to be written from their repos:

- *Miking LSP* (2024): automatic Language Server support for DSLs written in the
  Miking framework. Links to the VS Code marketplace listing. Screenshot:
  `docs/mikinglspdemo.png` from the repo, converted to `.webp`.
- *Rust browser engine* (2018): an HTML and CSS parser with a layout engine,
  written in Rust. Links to the GitHub repo.

**Image for the Rust browser engine.** The repo has no screenshot, so one has to
be made. It still builds and runs; its output is a `Debug` dump of the parsed
DOM tree, which is a wall of text on one line. My call: render a dark image in
the style of `rustlang.webp` showing a small, clean HTML input on the left and
the parsed tree, indented, on the right. The example HTML that ships with the
repo is not usable as-is: its attributes read `version="i want to die"`.

## Left to the builder

- Exact Tailwind classes and the dot/line sizing.
- The one-sentence description for each of the two new projects.
- Whether `tech` strings are per-project in YAML or derived.
