const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000';
const OUT  = path.join(__dirname, 'mobile-audit');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

const PAGES = [
    { name: 'home',          url: '/' },
    { name: 'browse',        url: '/browse' },
    { name: 'collection',    url: '/collection' },
    { name: 'favorites',     url: '/favorites' },
    { name: 'product',       url: '/book/hamlet' },
    { name: 'settings',      url: '/settings' },
    { name: 'contact',       url: '/contact' },
    { name: 'author',        url: '/author/stephen-king' },
    { name: 'all-authors',   url: '/authors' },
    { name: 'cart',          url: '/cart' },
    { name: 'checkout',      url: '/checkout' },
    { name: 'signin',        url: '/signin' },
    { name: 'signup',        url: '/signup' },
    { name: 'privacy',       url: '/privacy' },
    { name: 'terms',         url: '/terms' },
    { name: 'returns',       url: '/returns' },
];

const W = 430, H = 932;

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=430,932'],
    });

    const results = [];

    for (const page of PAGES) {
        const tab = await browser.newPage();
        await tab.setViewport({ width: W, height: H, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
        await tab.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');

        try {
            await tab.goto(BASE + page.url, { waitUntil: 'networkidle2', timeout: 12000 });
            await new Promise(r => setTimeout(r, 1500)); // let JS run

            const overflow = await tab.evaluate(() => {
                const vw = window.innerWidth;
                // Try actually scrolling right and see if position changes
                window.scrollTo(100, 0);
                const actualScrollX = window.scrollX || window.pageXOffset;
                window.scrollTo(0, 0);

                // Find elements visually extending beyond the right edge
                // Only count elements that are NOT clipped by a parent overflow:hidden
                const offenders = [];
                document.querySelectorAll('*').forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.right > vw + 1) {
                        // Check if an ancestor clips it
                        let clipped = false;
                        let p = el.parentElement;
                        while (p) {
                            const ov = window.getComputedStyle(p).overflowX;
                            if (ov === 'hidden' || ov === 'clip' || ov === 'scroll' || ov === 'auto') {
                                const pr = p.getBoundingClientRect();
                                if (pr.right <= vw + 1) { clipped = true; break; }
                            }
                            p = p.parentElement;
                        }
                        if (!clipped) {
                            offenders.push({
                                tag: el.tagName.toLowerCase(),
                                class: el.className ? el.className.toString().substring(0, 60) : '',
                                id: el.id || '',
                                right: Math.round(rect.right),
                                left: Math.round(rect.left),
                                width: Math.round(rect.width),
                            });
                        }
                    }
                });

                return {
                    scrollWidth: document.documentElement.scrollWidth,
                    clientWidth: vw,
                    actualScrollX,
                    canScrollX: actualScrollX > 0,
                    offenders: offenders.slice(0, 10),
                };
            });

            const shot = path.join(OUT, `${page.name}.png`);
            await tab.screenshot({ path: shot, fullPage: false });

            results.push({ ...page, overflow, shotPath: shot });
            const status = overflow.canScrollX ? '❌ SCROLLABLE' : '✅ OK';
            console.log(`${status} ${page.name.padEnd(15)} scrollX=${overflow.actualScrollX} scrollW=${overflow.scrollWidth} clientW=${overflow.clientWidth}`);
            if (overflow.offenders.length > 0) {
                overflow.offenders.slice(0, 5).forEach(o => {
                    console.log(`   unclipped overflow: <${o.tag}> class="${o.class}" right=${o.right} w=${o.width}`);
                });
            }
        } catch (e) {
            console.log(`⚠️  ERROR ${page.name}: ${e.message.substring(0, 80)}`);
            results.push({ ...page, error: e.message });
        } finally {
            await tab.close();
        }
    }

    await browser.close();

    const failed = results.filter(r => r.overflow && r.overflow.canScrollX);
    console.log('\n══════════════════════════════════════');
    console.log(`SUMMARY: ${results.length - failed.length}/${results.length} pages OK`);
    if (failed.length > 0) {
        console.log('FAILING:');
        failed.forEach(p => console.log(`  ❌ ${p.name}: scrollX=${p.overflow.actualScrollX}`));
    }
})();
