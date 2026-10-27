((document, window, body, undefined) => {
    const add = (el, cls) => el.classList.add(cls);
    const remove = (el, cls) => el.classList.remove(cls);
    const set = (el, cls, val) => (val ? add : remove)(el, cls);
    const select = id => document.querySelector(id);

    const mods = [
        // Mobile Navigation
        () => {
            let open = false;

            const animation = 3e2;
            const animations = [];

            const fixed = 'fixed';
            const active = 'active';
            const inactive = 'inactive';
            const hidden = 'hidden';
            
            const menuButton = select('#mobile-menu');
            const menu = select('#mobile-nav-wrapper');
            const menuInterior = select('#mobile-nav');

            const update = () => {
                set(menu, active, open);
                set(menu, inactive, !open);
                remove(menu, hidden);

                animations.push(setTimeout(() => !open && add(menu, hidden), animation));
            };

            window.addEventListener('click', e => {
                if(!open)
                    return;

                if(!menuInterior.contains(e.target)) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('blurred');
                    open = false;
                    update();
                }
            }, true);

            menuButton.addEventListener('click', () => {
                animations.forEach(clearTimeout);

                open = !open;

                set(body, fixed, open);
                set(menu, active, open);

                if(open) {
                    window.scrollTo({
                        top: 0,
                        left: 0,
                        behavior: 'smooth'
                    });
                }

                update();
            });
        },
        
        // Blog eval example: progressively enhance the excerpts with tabs and copying.
        () => document.querySelectorAll('.eval-example').forEach(example => {
            const tabList = example.querySelector('[role="tablist"]');
            const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
            const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
            const activate = index => tabs.forEach((tab, i) => {
                tab.setAttribute('aria-selected', i === index ? 'true' : 'false');
                tab.tabIndex = i === index ? 0 : -1;
                panels[i].hidden = i !== index;
            });

            tabs.forEach((tab, i) => {
                panels[i].setAttribute('role', 'tabpanel');
                panels[i].setAttribute('aria-labelledby', tab.id);
                const code = panels[i].querySelector('pre');
                code.tabIndex = 0;
                code.setAttribute('aria-label', `${tab.textContent} code excerpt`);
                tab.addEventListener('click', () => activate(i));
                tab.addEventListener('keydown', event => {
                    const target = {
                        ArrowRight: (i + 1) % tabs.length,
                        ArrowLeft: (i + tabs.length - 1) % tabs.length,
                        Home: 0,
                        End: tabs.length - 1
                    }[event.key];
                    if (target === undefined) return;
                    event.preventDefault();
                    activate(target);
                    tabs[target].focus();
                });
            });
            activate(0);
            tabList.hidden = false;

            const fullCode = example.querySelector('.eval-example-full pre');
            fullCode.tabIndex = 0;
            fullCode.setAttribute('aria-label', 'Full eval configuration');
            const copyControls = example.querySelector('.eval-example-copy');
            const copyButton = copyControls.querySelector('button');
            const copyStatus = copyControls.querySelector('[role="status"]');
            if (navigator.clipboard && navigator.clipboard.writeText) {
                copyControls.hidden = false;
                // Promises rather than async/await: Babel would compile async functions to
                // code that needs regeneratorRuntime, which the page doesn't load.
                copyButton.addEventListener('click', () => {
                    copyStatus.textContent = '';
                    navigator.clipboard.writeText(fullCode.textContent).then(
                        () => { copyStatus.textContent = 'Copied!'; },
                        () => { copyStatus.textContent = 'Select the code to copy it manually.'; }
                    );
                });
            }
        }),

        /* // Disable Mobile Parallax
        () => {
            const usedLaterScript = document.createElement('script');
            usedLaterScript.src = 'https://unpkg.com/jarallax@1.10/dist/jarallax.min.js';
            document.body.appendChild(usedLaterScript);

            window.addEventListener('load', () => {
                jarallax(document.querySelectorAll('.jarallax'), {
                    disableParallax: /iPad|iPhone|iPod|Android/,
                    disableVideo: /iPad|iPhone|iPod|Android/
                });
            });
        } */
    ];

    const run = () => mods.forEach(v => {
        try { v() }
        catch(e) { console.error(e); }
    });

    run();

    // if(document.readyState == 'complete') run();
    // else window.addEventListener('load', run);

})(document, window, document.body);
