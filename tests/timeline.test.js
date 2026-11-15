const assert = require('node:assert/strict');
const { test } = require('node:test');

const { spaceDots } = require('../src/script/timeline');

// spaceDots takes the cards in date order, each with the column it sits in and
// the top it lands at naturally, and returns the extra top margin each card
// needs so that no two dots on the spine end up closer than minGap.

test('cards that already clear each other are left alone', () => {
    const cards = [{ column: 'left', top: 0 }, { column: 'right', top: 400 }];
    assert.deepEqual(spaceDots(cards, 180), [0, 0]);
});

test('a crowded card is pushed down to exactly the minimum gap', () => {
    const cards = [{ column: 'left', top: 0 }, { column: 'right', top: 10 }];
    assert.deepEqual(spaceDots(cards, 180), [0, 170]);
});

test('two dots at the same height are separated', () => {
    const cards = [{ column: 'left', top: 100 }, { column: 'right', top: 100 }];
    assert.deepEqual(spaceDots(cards, 180), [0, 180]);
});

test('a push carries down to later cards in the same column', () => {
    // The third card shares a column with the first, so the second card's push
    // does not move it, but its own push is measured from where it now sits.
    const cards = [
        { column: 'left', top: 0 },
        { column: 'right', top: 10 },
        { column: 'left', top: 300 }
    ];
    assert.deepEqual(spaceDots(cards, 180), [0, 170, 60]);
});

test('a pushed card drags the rest of its column down with it', () => {
    const cards = [
        { column: 'left', top: 0 },
        { column: 'right', top: 0 },
        { column: 'right', top: 500 },
        { column: 'left', top: 900 }
    ];
    // Card 2 is pushed 180; card 3 inherits that shift and sits at 680, which
    // already clears card 2's dot, so it needs nothing of its own.
    assert.deepEqual(spaceDots(cards, 180), [0, 180, 0, 0]);
});

test('the gap is measured from the dot, not the card, so the offset cancels out', () => {
    const withOffset = spaceDots([{ column: 'left', top: 0 }, { column: 'right', top: 0 }], 180);
    assert.deepEqual(withOffset, [0, 180]);
});
