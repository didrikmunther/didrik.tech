// Projects timeline: the two columns flow independently so no card waits for
// the one opposite it, which means two dots can land on the same spot on the
// spine. This nudges cards down until every dot has room. The layout itself is
// plain CSS; without this script the timeline still reads, the dots just sit
// closer together.

(function (global) {
    var MIN_DOT_GAP = 180;
    var TWO_COLUMN_WIDTH = 1024;

    // Cards in date order, each { column, top }. Returns the extra top margin
    // each card needs. Pushing a card down moves everything below it in the
    // same column, so the shift is carried per column.
    var spaceDots = function (cards, minGap) {
        var shift = {};
        var previousDot = null;

        return cards.map(function (card) {
            var columnShift = shift[card.column] || 0;
            var dot = card.top + columnShift;
            var extra = 0;

            if (previousDot !== null && dot - previousDot < minGap) {
                extra = minGap - (dot - previousDot);
                shift[card.column] = columnShift + extra;
                dot = dot + extra;
            }

            previousDot = dot;

            return extra;
        });
    };

    var layout = function (document, window) {
        var timeline = document.querySelector('.timeline');

        if (!timeline) return;

        var cards = Array.prototype.slice.call(timeline.querySelectorAll('.timeline-row'))
            .sort(function (a, b) { return Number(a.style.order) - Number(b.style.order); });

        var apply = function () {
            cards.forEach(function (card) { card.style.marginTop = ''; });

            if (window.innerWidth < TWO_COLUMN_WIDTH) return;

            var measured = cards.map(function (card) {
                return {
                    column: card.parentNode.className.indexOf('tl-col-left') >= 0 ? 'left' : 'right',
                    top: card.offsetTop
                };
            });

            spaceDots(measured, MIN_DOT_GAP).forEach(function (margin, index) {
                if (margin) cards[index].style.marginTop = margin + 'px';
            });
        };

        apply();
        window.addEventListener('load', apply);
        window.addEventListener('resize', apply);
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { spaceDots: spaceDots };
    } else if (typeof document !== 'undefined') {
        layout(document, global);
    }
})(typeof window === 'undefined' ? null : window);
