// Projects page: "Run it here" opens a runnable project in a modal instead of a
// new tab. Every run button is a real link to the project's page, so without
// this script, or without <dialog> support, it still opens in a new tab.
(function () {
    var dialog = document.getElementById('run-dialog');

    if (!dialog || typeof dialog.showModal !== 'function') return;

    var frame = document.getElementById('run-frame');
    var title = document.getElementById('run-title');
    var hint = document.getElementById('run-hint');
    var newTab = document.getElementById('run-newtab');
    var closeButton = document.getElementById('run-close');
    var returnFocusTo = null;

    var open = function (trigger) {
        var row = trigger.closest('.timeline-row');

        returnFocusTo = (row && row.querySelector('.run-button')) || trigger;
        title.textContent = trigger.getAttribute('data-run-title');
        hint.textContent = trigger.getAttribute('data-run-hint') || '';
        newTab.href = trigger.getAttribute('data-run');

        // The frame has no src until now, so nothing downloads before a visitor asks.
        frame.src = trigger.getAttribute('data-run');
        document.documentElement.classList.add('run-open');
        dialog.showModal();
        frame.focus();
    };

    document.addEventListener('click', function (event) {
        var trigger = event.target.closest && event.target.closest('[data-run]');

        if (!trigger) return;
        // Let a modified click open the project in a new tab as usual.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

        event.preventDefault();
        open(trigger);
    });

    // Once the project has loaded, hand it keyboard focus so games take arrow keys
    // straight away, and let Escape inside it close the modal, unless a text field
    // in the project used that Escape itself (Rost's editor closing its suggestion
    // popup, say). Games mark every key as handled, so only editable targets count.
    var isEditable = function (element) {
        return element && (element.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName));
    };

    frame.addEventListener('load', function () {
        if (!dialog.open) return;
        try {
            frame.contentWindow.focus();
            frame.contentWindow.addEventListener('keydown', function (event) {
                if (event.key !== 'Escape') return;
                if (event.defaultPrevented && isEditable(event.target)) return;
                dialog.close();
            });
        } catch (error) { /* cross-origin: leave focus on the frame */ }
    });

    closeButton.addEventListener('click', function () { dialog.close(); });

    // A click on the backdrop, outside the dialog box, closes it.
    dialog.addEventListener('click', function (event) {
        if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener('close', function () {
        // Unloading the frame stops any game loop, sound or download that was running.
        frame.removeAttribute('src');
        frame.src = 'about:blank';
        document.documentElement.classList.remove('run-open');
        if (returnFocusTo) returnFocusTo.focus();
    });
})();
