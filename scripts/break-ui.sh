#!/bin/bash

# Dev-only. Renders the projects page against worst-case data so you can see
# what breaks, and drops a Demo / Worst case / Empty / One / 1,000 toggle on
# each copy. The data goes in through the same boundary the real data does —
# src/data/projects.yaml — so nothing about the page itself is edited.
#
#   bash scripts/break-ui.sh        then open /break/demo/
#
# Output goes to dist/en/break/, which is git-ignored and never deployed:
# deploy.sh copies dist/en, so delete the folder or rebuild before deploying.

set -e

cd "$(dirname "$0")/.."

real="src/data/projects.yaml"
backup="$(mktemp)"
cp "$real" "$backup"
restore() { cp "$backup" "$real"; rm -f "$backup" "$real.tmp"; }
trap restore EXIT

node -e '
const fs = require("fs");
const YAML = require("yaml");
const projects = YAML.parse(fs.readFileSync("src/data/projects.yaml", "utf8")).projects;
const dated = projects.filter(p => p.year);
const closing = projects.find(p => !p.year);

// A realistic upper bound for a hand-written portfolio that never paginates.
const huge = Array.from({ length: 1000 }, (_, i) => ({
    ...dated[i % dated.length],
    id: "huge" + i,
    year: String(2026 - Math.floor(i / 12))
}));

fs.writeFileSync("src/data/projects-empty.yaml", YAML.stringify({ projects: [closing] }));
fs.writeFileSync("src/data/projects-one.yaml", YAML.stringify({ projects: [dated[0], closing] }));
fs.writeFileSync("src/data/projects-huge.yaml", YAML.stringify({ projects: [...huge, closing] }));
'

for state in demo worst empty one huge; do
    case "$state" in
        demo) cp "$backup" "$real" ;;
        *)    cp "src/data/projects-$state.yaml" "$real" ;;
    esac

    npm run build-only-dynamic >/dev/null

    mkdir -p "dist/en/break/$state"
    cp out/projects/index.html "dist/en/break/$state/index.html"

    node scripts/break-ui-toggle.js "dist/en/break/$state/index.html" "$state"
    echo "  /break/$state/"
done

rm -f src/data/projects-empty.yaml src/data/projects-one.yaml src/data/projects-huge.yaml

echo "Serve dist/en and open /break/demo/ — the toggle is at the bottom of the page."
