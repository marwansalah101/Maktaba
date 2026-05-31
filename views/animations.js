/* ═══════════════════════════════════════════════════════════════
   MAKTABA — ANIMATION ENGINE  v3
   Reliable-first: above-fold elements use data-enter (always fires).
   Scroll elements use data-reveal with an in-viewport fallback
   so IO failures never leave content permanently invisible.
═══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── 1. SCROLL PROGRESS BAR ─────────────────────────────── */
    var bar = document.createElement('div');
    bar.id  = 'anim-progress';
    document.body.appendChild(bar);

    var rafBar = null;
    function updateBar() {
        var max = document.body.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ')';
        rafBar = null;
    }
    window.addEventListener('scroll', function () {
        if (!rafBar) rafBar = requestAnimationFrame(updateBar);
    }, { passive: true });
    updateBar();

    if (REDUCED) {
        /* Instant-reveal everything and exit — no motion */
        setTimeout(function () {
            document.querySelectorAll('[data-reveal],[data-s],[data-enter]').forEach(function (el) {
                el.classList.add('a-revealed', 'a-page-enter--on');
            });
            document.querySelectorAll('.a-line-inner').forEach(function (el) {
                el.classList.add('a-line-inner--on');
            });
        }, 0);
        return;
    }

    /* ── Helper: is element intersecting the current viewport? ─ */
    function inViewport(el) {
        var r = el.getBoundingClientRect();
        return r.top < window.innerHeight - 20 && r.bottom > 20;
    }

    /* ── Helper: reveal a data-reveal element ──────────────────  */
    function applyReveal(el) {
        var delay = parseInt(el.dataset.delay || 0, 10);
        el.style.willChange = 'transform, opacity';
        setTimeout(function () {
            el.classList.add('a-revealed');
            setTimeout(function () { el.style.willChange = 'auto'; }, 850);
        }, delay);
    }

    /* ── 2. SCROLL REVEAL  (data-reveal) ────────────────────── */
    var revealEls = Array.from(document.querySelectorAll('[data-reveal]'));

    if (revealEls.length && 'IntersectionObserver' in window) {
        var revealObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                applyReveal(entry.target);
                revealObs.unobserve(entry.target);
            });
        }, { threshold: 0.06, rootMargin: '0px 0px -20px 0px' });

        revealEls.forEach(function (el) {
            if (inViewport(el)) {
                /* Already visible — reveal immediately, no IO needed */
                applyReveal(el);
            } else {
                revealObs.observe(el);
            }
        });

        /* Safety net: after 4 s, force-reveal anything still hidden */
        setTimeout(function () {
            revealEls.forEach(function (el) {
                if (!el.classList.contains('a-revealed')) {
                    el.classList.add('a-revealed');
                    el.style.willChange = 'auto';
                }
            });
        }, 4000);

    } else {
        /* No IO support — instant reveal */
        revealEls.forEach(function (el) { el.classList.add('a-revealed'); });
    }

    /* ── 3. STAGGER CHILDREN  (data-stagger, data-s) ────────── */
    var staggerEls = Array.from(document.querySelectorAll('[data-stagger]'));
    if (staggerEls.length && 'IntersectionObserver' in window) {
        var staggerObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var parent   = entry.target;
                var children = parent.querySelectorAll('[data-s]');
                var step     = parseInt(parent.dataset.stagger || 75, 10);
                children.forEach(function (child, i) {
                    child.style.willChange = 'transform, opacity';
                    setTimeout(function () {
                        child.classList.add('a-revealed');
                        setTimeout(function () { child.style.willChange = 'auto'; }, 850);
                    }, i * step);
                });
                staggerObs.unobserve(parent);
            });
        }, { threshold: 0.05 });

        staggerEls.forEach(function (p) {
            if (inViewport(p)) {
                var children = p.querySelectorAll('[data-s]');
                var step     = parseInt(p.dataset.stagger || 75, 10);
                children.forEach(function (child, i) {
                    child.style.willChange = 'transform, opacity';
                    setTimeout(function () {
                        child.classList.add('a-revealed');
                        setTimeout(function () { child.style.willChange = 'auto'; }, 850);
                    }, i * step);
                });
            } else {
                staggerObs.observe(p);
            }
        });
    }

    /* ── 4. TEXT LINE REVEAL  (data-text-reveal) ─────────────── */
    /*
       IMPORTANT: only runs on elements that are NOT inside a
       [data-reveal] container. Elements inside data-reveal parents
       are hidden (opacity:0) when their timers fire — the reveal
       animation is wasted. Those elements just fade in with the
       parent reveal instead.
    */
    document.querySelectorAll('[data-text-reveal]').forEach(function (heading) {
        /* Skip if any ancestor has data-reveal */
        var ancestor = heading.parentElement;
        while (ancestor) {
            if (ancestor.hasAttribute('data-reveal')) return;
            ancestor = ancestor.parentElement;
        }

        var children = Array.from(heading.children);
        var baseMs   = parseInt(heading.dataset.textDelay || 120, 10);

        children.forEach(function (child, i) {
            var wrap  = document.createElement('div');
            var inner = document.createElement('div');
            wrap.className  = 'a-line-wrap';
            inner.className = 'a-line-inner';
            wrap.style.display  = 'block';
            inner.style.display = 'block';

            child.parentNode.insertBefore(wrap, child);
            wrap.appendChild(inner);
            inner.appendChild(child);

            inner.style.willChange = 'transform';
            setTimeout(function () {
                inner.classList.add('a-line-inner--on');
                setTimeout(function () { inner.style.willChange = 'auto'; }, 1000);
            }, baseMs + i * 130);
        });
    });

    /* ── 5. PAGE ENTER  (data-enter="delay-ms") ─────────────── */
    document.querySelectorAll('[data-enter]').forEach(function (el) {
        var delay = parseInt(el.dataset.enter || 0, 10);
        el.classList.add('a-page-enter');
        el.style.willChange = 'transform, opacity';
        setTimeout(function () {
            el.classList.add('a-page-enter--on');
            setTimeout(function () { el.style.willChange = 'auto'; }, 900);
        }, delay);
    });

    /* ── 6. 3D TILT  (data-tilt) ────────────────────────────── */
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
        var intensity = parseFloat(el.dataset.tilt || 6);

        el.addEventListener('mouseenter', function () {
            el.style.willChange = 'transform';
        });
        el.addEventListener('mousemove', function (e) {
            var rect = el.getBoundingClientRect();
            var x    = (e.clientX - rect.left)  / rect.width  - 0.5;
            var y    = (e.clientY - rect.top)   / rect.height - 0.5;
            el.style.transition = 'transform 0s';
            el.style.transform  = [
                'perspective(920px)',
                'rotateX(' + (y * -intensity) + 'deg)',
                'rotateY(' + (x *  intensity) + 'deg)',
                'scale(1.022)'
            ].join(' ');
        });
        el.addEventListener('mouseleave', function () {
            el.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            el.style.transform  = '';
            var _el = el;
            setTimeout(function () {
                _el.style.transition = '';
                _el.style.willChange = 'auto';
            }, 520);
        });
    });

    /* ── 7. MAGNETIC  (data-magnetic) ───────────────────────── */
    document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
        var pull = parseFloat(btn.dataset.magnetic || 0.25);
        btn.addEventListener('mouseenter', function () { btn.style.willChange = 'transform'; });
        btn.addEventListener('mousemove', function (e) {
            var rect = btn.getBoundingClientRect();
            var cx = rect.left + rect.width  / 2;
            var cy = rect.top  + rect.height / 2;
            btn.style.transition = 'transform 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            btn.style.transform  = 'translate(' + ((e.clientX - cx) * pull) + 'px,' + ((e.clientY - cy) * pull) + 'px)';
        });
        btn.addEventListener('mouseleave', function () {
            btn.style.transition = 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            btn.style.transform  = '';
            var _btn = btn;
            setTimeout(function () { _btn.style.transition = ''; _btn.style.willChange = 'auto'; }, 460);
        });
    });

})();
