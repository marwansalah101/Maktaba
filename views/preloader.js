/* ═══════════════════════════════════════════════════════════════
   MAKTABA — PRELOADER CONTROLLER
   Minimum display: 1400 ms (luxury pacing).
   Maximum display: 6000 ms (hard cap — never blocks page).
   Exit: clip-path curtain-rise (CSS class .mkt--done).
   No layout impact — uses position:fixed and is removed from
   the paint tree via display:none after the transition ends.
═══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    var MIN_MS   = 1400;
    var MAX_MS   = 6000;
    var startAt  = Date.now();
    var fired    = false;

    function exit() {
        if (fired) return;
        fired = true;

        var pl = document.getElementById('mkt-preloader');
        if (!pl) return;

        var elapsed   = Date.now() - startAt;
        var remaining = Math.max(0, MIN_MS - elapsed);

        setTimeout(function () {
            /* Trigger CSS curtain-rise exit */
            pl.classList.add('mkt--done');

            /* After transition ends: remove from paint tree entirely */
            setTimeout(function () {
                pl.style.display    = 'none';
                pl.style.visibility = 'hidden';
                /* Restore any overflow lock if present */
                document.documentElement.style.overflow = '';
                document.documentElement.style.overflowY = '';
            }, 820); /* matches 0.78s CSS transition + 40ms buffer */

        }, remaining);
    }

    /* Primary trigger: after all resources finish loading */
    window.addEventListener('load', exit, { once: true });

    /* Hard cap: never block the page for more than MAX_MS */
    setTimeout(exit, MAX_MS);

})();
