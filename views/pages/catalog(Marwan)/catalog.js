/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   catalog.js — shared script for genre, collection, and author pages
   Depends on: data.js (Books, authorData), catalog.css
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 1 — GENRE PAGE  (G3)
   Renders the accordion genre strips from a static list,
   fetches the live book catalogue from the DB so per-genre
   counts are accurate, then initialises the AI chat panel
   which streams recommendations via /api/recommend (SSE).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
(function initGenrePage() {

    const stripsWrap = document.getElementById('g3Strips');
    if (!stripsWrap) return; // not on the G3 genre page

    /* ── Genre definitions ──────────────────────────────────── */
    const GENRES = [
        {
            num: '01', name: 'Fantasy',
            tag: 'Worlds beyond',     clr: '#8B5CF6', dark: '#1e1030',
            img: '../../resources/img/Dragon.jpg',
            desc: 'Vast kingdoms, ancient magic, and heroes forged in impossible choices. Fantasy transports you to worlds where anything can happen — and usually does.',
            slug: 'Fantasy',
        },
        {
            num: '02', name: 'Horror',
            tag: 'Face your fears',   clr: '#EF4444', dark: '#1a0505',
            img: '../../resources/img/Horror.png',
            desc: 'Stories that crawl beneath your skin and linger long after the last page. Horror dares you to face the darkness — in the world, and in yourself.',
            slug: 'Horror',
        },
        {
            num: '03', name: 'Thriller',
            tag: 'Edge of your seat', clr: '#3B82F6', dark: '#050c1a',
            img: '../../resources/img/Thriller.png',
            desc: 'Racing hearts, hidden motives, and twists that rewrite everything. Thrillers keep you reading at 2 a.m. — sleep can wait.',
            slug: 'Thriller',
        },
        {
            num: '04', name: 'Science Fiction',
            tag: 'The future now',    clr: '#10B981', dark: '#011a10',
            img: '../../resources/img/Scifi.png',
            desc: 'What if technology changed everything? Science fiction explores the ideas that will shape tomorrow — before tomorrow arrives.',
            slug: 'Science Fiction',
        },
        {
            num: '05', name: 'Adventure',
            tag: 'Beyond the horizon', clr: '#F59E0B', dark: '#1a1000',
            img: '../../resources/img/Adventure.png',
            desc: 'Open roads, uncharted territories, and the raw thrill of discovery. Adventure books remind you the world is bigger than you imagined.',
            slug: 'Adventure',
        },
        {
            num: '06', name: 'Drama',
            tag: 'Deeply human',      clr: '#EC4899', dark: '#1a0514',
            img: '../../resources/img/Drama.png',
            desc: 'Stories of love, loss, ambition, and redemption. Drama reveals what it means to be human — messy, beautiful, and relentlessly alive.',
            slug: 'Drama',
        },
    ];

    /* ── Render strips ──────────────────────────────────────── */
    stripsWrap.innerHTML = GENRES.map(function(g) {
        var metaId = 'g3Meta_' + g.slug.replace(/\s/g, '_');
        var ctaHref = './authors.html?genre=' + encodeURIComponent(g.slug);
        return (
            '<div class="g3-strip"' +
                ' role="listitem"' +
                ' tabindex="0"' +
                ' aria-label="' + g.name + ' genre"' +
                ' style="--g-clr:' + g.clr + '; --g-dark:' + g.dark + ';"' +
                ' data-genre="' + g.slug + '">' +

                '<div class="g3-strip-bg"' +
                    ' style="background-image:url(\'' + g.img + '\');"' +
                    ' aria-hidden="true"></div>' +

                '<div class="g3-strip-tint" aria-hidden="true"></div>' +

                '<div class="g3-strip-inner">' +
                    '<div class="g3-strip-expand">' +
                        '<p class="g3-strip-desc">' + g.desc + '</p>' +
                        '<a class="g3-strip-cta"' +
                           ' href="' + ctaHref + '"' +
                           ' tabindex="-1">Browse ' + g.name + ' →</a>' +
                    '</div>' +
                    '<div class="g3-strip-row">' +
                        '<span class="g3-strip-num" aria-hidden="true">' + g.num + '</span>' +
                        '<span class="g3-strip-name">' + g.name + '</span>' +
                        '<span class="g3-strip-meta" id="' + metaId + '">— books</span>' +
                        '<span class="g3-strip-tag">' + g.tag + '</span>' +
                        '<span class="g3-strip-arrow" aria-hidden="true">↗</span>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    }).join('');

    /* ── Staggered scroll-reveal ────────────────────────────── */
    var allStrips = stripsWrap.querySelectorAll('.g3-strip');

    var revealObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (!entry.isIntersecting) return;
            var strip = entry.target;
            var idx = Array.prototype.indexOf.call(allStrips, strip);
            setTimeout(function() { strip.classList.add('g3-strip--visible'); }, idx * 80);
            revealObs.unobserve(strip);
        });
    }, { threshold: 0.04 });

    allStrips.forEach(function(s) { revealObs.observe(s); });

    /* ── Accordion expand/collapse ──────────────────────────── */
    var leaveTimer  = null;
    var activeStrip = null;

    function expandStrip(strip) {
        if (activeStrip === strip) return;
        if (activeStrip) {
            activeStrip.classList.remove('g3-strip--active');
            var prevCta = activeStrip.querySelector('.g3-strip-cta');
            if (prevCta) prevCta.setAttribute('tabindex', '-1');
        }
        activeStrip = strip;
        strip.classList.add('g3-strip--active');
        var cta = strip.querySelector('.g3-strip-cta');
        if (cta) cta.removeAttribute('tabindex');
    }

    function collapseActive() {
        if (!activeStrip) return;
        activeStrip.classList.remove('g3-strip--active');
        var cta = activeStrip.querySelector('.g3-strip-cta');
        if (cta) cta.setAttribute('tabindex', '-1');
        activeStrip = null;
    }

    allStrips.forEach(function(strip) {
        strip.addEventListener('mouseenter', function() {
            clearTimeout(leaveTimer);
            expandStrip(strip);
        });
        strip.addEventListener('focus', function() {
            clearTimeout(leaveTimer);
            expandStrip(strip);
        });
        strip.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                var cta = strip.querySelector('.g3-strip-cta');
                if (cta) { e.preventDefault(); cta.click(); }
            }
        });
    });

    stripsWrap.addEventListener('mouseleave', function() {
        clearTimeout(leaveTimer);
        leaveTimer = setTimeout(collapseActive, 350);
    });

    stripsWrap.addEventListener('focusout', function(e) {
        if (!stripsWrap.contains(e.relatedTarget)) {
            clearTimeout(leaveTimer);
            leaveTimer = setTimeout(collapseActive, 350);
        }
    });

    /* ── Fetch books from DB ────────────────────────────────── */
    var dbBooks = [];
    var bookCountEl = document.getElementById('g3BookCount');

    fetch('/books')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            var books = Array.isArray(data) ? data : (data.books || []);
            dbBooks = books;

            /* Count-up animation */
            if (bookCountEl) {
                var target  = books.length;
                var current = 0;
                var step    = Math.max(1, Math.ceil(target / 40));
                var timer   = setInterval(function() {
                    current = Math.min(current + step, target);
                    bookCountEl.textContent = current;
                    if (current >= target) clearInterval(timer);
                }, 40);
            }

            /* Per-genre book counts */
            GENRES.forEach(function(g) {
                var count = books.filter(function(b) {
                    return (b.genre || '').toLowerCase() === g.slug.toLowerCase();
                }).length;
                var el = document.getElementById('g3Meta_' + g.slug.replace(/\s/g, '_'));
                if (el) el.textContent = count + ' book' + (count !== 1 ? 's' : '');
            });

            initAIChat(dbBooks);
        })
        .catch(function() {
            if (bookCountEl) bookCountEl.textContent = '—';
            initAIChat([]);
        });

    /* ── Genre name rotator ─────────────────────────────────── */
    var rotator = document.getElementById('g3Rotator');
    if (rotator) {
        var rotItems = rotator.querySelectorAll('.g3-ri');
        var rotIdx   = 0;
        setInterval(function() {
            rotItems[rotIdx].removeAttribute('data-active');
            rotIdx = (rotIdx + 1) % rotItems.length;
            rotItems[rotIdx].setAttribute('data-active', 'true');
        }, 2000);
    }

    /* ════════════════════════════════════════════════════════
       AI CHAT — streaming via /api/recommend (SSE)
    ════════════════════════════════════════════════════════ */
    function initAIChat(books) {
        var fab      = document.getElementById('g3AiFab');
        var panel    = document.getElementById('g3ChatPanel');
        var closeBtn = document.getElementById('g3ChatClose');
        var messages = document.getElementById('g3Messages');
        var typingEl = document.getElementById('g3Typing');
        var textarea = document.getElementById('g3Input');
        var sendBtn  = document.getElementById('g3Send');
        var chips    = document.querySelectorAll('.g3-chip');

        if (!fab || !panel) return;

        /* ── Open / close ─────────────────────────────────── */
        function openPanel() {
            panel.classList.add('g3-chat-panel--open');
            panel.setAttribute('aria-hidden', 'false');
            fab.classList.add('g3-ai-fab--hide');
            fab.setAttribute('aria-expanded', 'true');
            setTimeout(function() { if (textarea) textarea.focus(); }, 350);
        }

        function closePanel() {
            panel.classList.remove('g3-chat-panel--open');
            panel.setAttribute('aria-hidden', 'true');
            fab.classList.remove('g3-ai-fab--hide');
            fab.setAttribute('aria-expanded', 'false');
        }

        fab.addEventListener('click', openPanel);
        if (closeBtn) closeBtn.addEventListener('click', closePanel);

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && panel.classList.contains('g3-chat-panel--open')) {
                closePanel();
            }
        });

        /* ── Mood chip shortcut ───────────────────────────── */
        chips.forEach(function(chip) {
            chip.addEventListener('click', function() {
                if (!panel.classList.contains('g3-chat-panel--open')) openPanel();
                var mood = chip.dataset.mood;
                if (textarea) {
                    textarea.value = mood;
                    textarea.dispatchEvent(new Event('input'));
                }
                sendMessage(mood);
            });
        });

        /* ── Auto-grow textarea ───────────────────────────── */
        if (textarea) {
            textarea.addEventListener('input', function() {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            });
            textarea.addEventListener('keydown', function(e) {
                var isDesktop = window.innerWidth > 768;
                if (e.key === 'Enter' && (e.ctrlKey || (isDesktop && !e.shiftKey))) {
                    e.preventDefault();
                    var val = textarea.value.trim();
                    if (val) sendMessage(val);
                }
            });
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', function() {
                var val = textarea ? textarea.value.trim() : '';
                if (val) sendMessage(val);
            });
        }

        /* ── Send ─────────────────────────────────────────── */
        var isBusy = false;

        function sendMessage(text) {
            if (isBusy || !text.trim()) return;
            isBusy = true;
            addBubble('user', text);
            if (textarea) { textarea.value = ''; textarea.style.height = 'auto'; }
            showTyping(true);
            streamRecommendation(text, books)
                .catch(function(err) {
                    showTyping(false);
                    addBubble('ai', 'Sorry, something went wrong. (' + err.message + ')');
                })
                .finally(function() { isBusy = false; });
        }

        /* ── Add message bubble ───────────────────────────── */
        function nowTime() {
            var d = new Date();
            return d.getHours().toString().padStart(2, '0') + ':' +
                   d.getMinutes().toString().padStart(2, '0');
        }

        function addBubble(role, text) {
            var div = document.createElement('div');
            div.className = 'g3-msg g3-msg--' + role;
            div.innerHTML =
                '<div class="g3-bubble"></div>' +
                '<time class="g3-msg-time">' + nowTime() + '</time>';
            div.querySelector('.g3-bubble').textContent = text;
            messages.appendChild(div);
            requestAnimationFrame(function() { div.classList.add('g3-msg--visible'); });
            messages.scrollTop = messages.scrollHeight;
            return div;
        }

        function addStreamingBubble() {
            var div = document.createElement('div');
            div.className = 'g3-msg g3-msg--ai';
            div.innerHTML =
                '<div class="g3-bubble"><span class="g3-cursor"></span></div>' +
                '<time class="g3-msg-time">' + nowTime() + '</time>';
            messages.appendChild(div);
            requestAnimationFrame(function() { div.classList.add('g3-msg--visible'); });
            messages.scrollTop = messages.scrollHeight;
            return div;
        }

        /* ── Typing indicator ─────────────────────────────── */
        function showTyping(show) {
            if (typingEl) typingEl.classList.toggle('g3-typing--visible', show);
            if (show && messages) messages.scrollTop = messages.scrollHeight;
        }

        /* ── Stream from /api/recommend ───────────────────── */
        async function streamRecommendation(userMsg, bookList) {
            var response = await fetch('/api/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, books: bookList }),
            });

            if (!response.ok) {
                var errText = await response.text();
                throw new Error(errText || 'API error ' + response.status);
            }

            /* Switch to streaming bubble */
            showTyping(false);
            var msgDiv = addStreamingBubble();
            var bubble = msgDiv.querySelector('.g3-bubble');
            var cursor = bubble.querySelector('.g3-cursor');

            var reader   = response.body.getReader();
            var decoder  = new TextDecoder();
            var fullText = '';

            while (true) {
                var _a     = await reader.read();
                var done   = _a.done;
                var value  = _a.value;
                if (done) break;

                var chunk = decoder.decode(value, { stream: true });
                var lines = chunk.split('\n');

                for (var li = 0; li < lines.length; li++) {
                    var line = lines[li];
                    if (!line.startsWith('data:')) continue;
                    var raw = line.slice(5).trim();
                    if (raw === '[DONE]') continue;
                    try {
                        var parsed = JSON.parse(raw);
                        var delta  = (parsed.choices &&
                                      parsed.choices[0] &&
                                      parsed.choices[0].delta &&
                                      parsed.choices[0].delta.content) || '';
                        if (delta) {
                            fullText += delta;
                            bubble.textContent = fullText;
                            if (cursor && cursor.parentNode !== bubble) {
                                bubble.appendChild(cursor);
                            } else if (!cursor) {
                                /* cursor already removed — just update text */
                            } else {
                                bubble.textContent = fullText;
                                bubble.appendChild(cursor);
                            }
                            messages.scrollTop = messages.scrollHeight;
                        }
                    } catch (e) { /* skip malformed SSE chunks */ }
                }
            }

            /* Finalise — remove cursor, set clean text */
            if (cursor && cursor.parentNode === bubble) bubble.removeChild(cursor);
            bubble.textContent = fullText;
            messages.scrollTop = messages.scrollHeight;
        }
    } /* end initAIChat */

})(); /* end initGenrePage */

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 2 — FLY-TO-CART ANIMATION (shared)
   Used by the collection page. Creates a small dark
   book-shaped element that flies from a source element
   to the navbar cart icon, which then bounces on arrival.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function flyToCart(sourceEl) {
    const cartIcon = document.querySelector('.navbar-icons a .material-symbols-outlined');
    if (!cartIcon || !sourceEl) return;

    const srcRect = sourceEl.getBoundingClientRect();
    const dstRect = cartIcon.getBoundingClientRect();

    // Create the flying element starting at the book cover's centre
    const el = document.createElement('div');
    el.className  = 'fly-item';
    el.style.left = (srcRect.left + srcRect.width  / 2 - 19) + 'px';
    el.style.top  = (srcRect.top  + srcRect.height / 2 - 26) + 'px';
    document.body.appendChild(el);

    // Double rAF ensures the starting position is painted before the
    // CSS transition kicks in (otherwise it jumps straight to the end)
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            el.style.left      = (dstRect.left + dstRect.width  / 2 - 10) + 'px';
            el.style.top       = (dstRect.top  + dstRect.height / 2 - 10) + 'px';
            el.style.width     = '20px';
            el.style.height    = '20px';
            el.style.opacity   = '0';
            el.style.transform = 'scale(0.2)';
        });
    });

    // When the element arrives, bounce the cart icon and clean up
    setTimeout(() => {
        el.remove();
        cartIcon.classList.add('cart-bounce');
        setTimeout(() => cartIcon.classList.remove('cart-bounce'), 600);
    }, 640);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 3 — COLLECTION PAGE
   State variables: activeGenre, activeSort, searchQuery
   are module-level so sort, filter, and search can each
   call renderBooks(getFilteredBooks()) independently.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const container = document.getElementById("books-container");

let activeGenre = 'all';
let activeSort  = 'default';
let searchQuery = '';
let currentPage = 1;
let _backendBooks = null; /* populated by initCollectionPage() */

const PAGE_SIZE = 20;

/* Check URL for genre parameter (from genre browse page) */
const urlParams = new URLSearchParams(window.location.search);
const genreParam = urlParams.get('genre');
if (genreParam) {
    activeGenre = genreParam;
}

/* Returns a sorted copy of the books array */
function sortBooks(books) {
    const arr = [...books];
    if (activeSort === 'price-asc')  arr.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    if (activeSort === 'price-desc') arr.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    if (activeSort === 'title')      arr.sort((a, b) => a.title.localeCompare(b.title));
    return arr;
}

/* Applies active genre filter + live search, then sorts */
function getFilteredBooks() {
    let books = (_backendBooks && _backendBooks.length > 0) ? [..._backendBooks]
              : (typeof Books !== 'undefined' ? [...Books] : []);
    if (activeGenre !== 'all') {
        const norm = s => s.toLowerCase().replace(/-/g, ' ').trim();
        books = books.filter(b => b.genre && norm(b.genre) === norm(activeGenre));
    }
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        books = books.filter(b =>
            b.title.toLowerCase().includes(q)  ||
            b.author.toLowerCase().includes(q) ||
            b.genre.toLowerCase().includes(q)
        );
    }
    return sortBooks(books);
}

function bookStars(rating) {
    const r = Math.max(0, Math.min(5, parseFloat(rating) || 0));
    const full = Math.floor(r);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
}

/* Renders the full book grid — called on every filter/sort/search change */
function renderBooks(booksToRender) {
    if (!container) return;
    container.innerHTML = '';

    const totalPages  = Math.ceil(booksToRender.length / PAGE_SIZE);
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

    const startIdx   = (currentPage - 1) * PAGE_SIZE;
    const visibleBooks = booksToRender.slice(startIdx, startIdx + PAGE_SIZE);

    // Update the "N Books" count label
    const countEl = document.getElementById('book-count');
    if (countEl) {
        countEl.textContent = booksToRender.length + (booksToRender.length === 1 ? ' Book' : ' Books');
    }

    if (booksToRender.length === 0) {
        container.innerHTML =
            '<p style="grid-column:1/-1;text-align:center;padding:60px 0;font-family:Jost,sans-serif;font-size:14px;color:#8C7B75;">No books found.</p>';
        renderPagination(0);
        return;
    }

    const basePath = window.location.pathname.includes('/pages/') ? '../../' : './';

    visibleBooks.forEach((book, index) => {
        const card        = document.createElement('div');
        card.classList.add('book-listing');
        card.style.animationDelay = `${index * 55}ms`;

        const productUrl  = `/book/${normalizeSlug(book.title)}`;
        const imgSrc      = book.image.startsWith('http') ? book.image : `${basePath}${book.image}`;

        /* Card structure:
           - .book-rating-row  — star rating at the top
           - .book-cover-wrap  — linked book cover image with glow bloom
           - .book-meta        — genre tag, title link, author, price
           - .add-to-cart      — hidden until hover (CSS opacity trick)
        */
        card.innerHTML = `
          <div class="book-rating-row">
            <span class="book-stars">${bookStars(book.averageRating)}</span>
            <span class="book-stars-count">(${book.averageRating ? Number(book.averageRating).toFixed(1) : 'N/A'})</span>
          </div>
          <a href="${productUrl}" class="book-cover-wrap book-link">
            <div class="book-cover-stage">
              <img class="book-cover-glow" src="${imgSrc}" aria-hidden="true" draggable="false">
              <img class="book-cover" src="${imgSrc}" alt="${book.title}">
            </div>
          </a>
          <div class="book-meta">
            <p class="book-genre-tag">${book.genre}</p>
            <a href="${productUrl}" class="book-link">
              <h3 class="book-title">${book.title}</h3>
            </a>
            <a href="/pages/catalog(Marwan)/authors.html?slug=${normalizeSlug(book.author)}" class="book-author-link">
              <p class="book-author">${book.author}</p>
            </a>
            <p class="book-price">L.E ${(Number(book.price)).toFixed(2)}</p>
          </div>
          <button class="add-to-cart" type="button">Add to cart</button>
        `;

        /* Add to Cart: updates localStorage, triggers fly animation, shows feedback */
        card.querySelector('.add-to-cart').addEventListener('click', e => {
            e.stopPropagation();
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const existing = cart.find(item => item.title === book.title);
            if (existing) {
                existing.qty = (existing.qty || 1) + 1;
            } else {
                cart.push({
                    title:  book.title,
                    author: book.author,
                    price:  book.price,
                    image:  book.image,
                    qty:    1
                });
            }
            localStorage.setItem('cart', JSON.stringify(cart));

            // Fly the book cover to the cart icon
            flyToCart(card.querySelector('.book-cover'));

            // Brief button feedback
            const addBtn = e.currentTarget;
            addBtn.textContent    = 'Added ✓';
            addBtn.style.background = '#5a4232';
            setTimeout(() => {
                addBtn.textContent      = 'Add to cart';
                addBtn.style.background = '';
            }, 1200);
        });

        const favBtn = card.querySelector('.collection-fav-btn');
        if (favBtn) {
            updateFavoriteButton(favBtn, book.title);
            favBtn.addEventListener('click', e => {
                e.stopPropagation();
                const wasAdded = toggleFavorite(book.title);
                updateFavoriteButton(favBtn, book.title);
                favBtn.setAttribute('aria-label', wasAdded ? 'Remove from favorites' : 'Add to favorites');
                if (wasAdded) {
                    try {
                        const fc = JSON.parse(localStorage.getItem('mktFavData') || '{}');
                        fc[book.title] = { image: book.image, author: book.author, price: book.price, genre: book.genre };
                        localStorage.setItem('mktFavData', JSON.stringify(fc));
                    } catch (_) {}
                }
            });
        }

        container.appendChild(card);
    });

    renderPagination(totalPages);
}

/* Builds a page-number array with ellipsis, e.g. [1,'...',4,5,6,'...',12] */
function getPageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [1];
    if (current - 2 > 2) pages.push('...');
    for (let i = Math.max(2, current - 2); i <= Math.min(total - 1, current + 2); i++) pages.push(i);
    if (current + 2 < total - 1) pages.push('...');
    pages.push(total);
    return pages;
}

/* Renders pagination controls into .collection-more-wrap */
function renderPagination(totalPages) {
    const wrap = document.querySelector('.collection-more-wrap');
    if (!wrap) return;
    if (totalPages <= 1) { wrap.innerHTML = ''; return; }

    const pages = getPageNumbers(currentPage, totalPages);
    wrap.innerHTML = `
        <nav class="pagination" aria-label="Books pagination">
            <button class="page-btn page-prev" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}" aria-label="Previous page">&#8249;</button>
            ${pages.map(p => p === '...'
                ? '<span class="page-ellipsis">…</span>'
                : `<button class="page-btn${p === currentPage ? ' page-active' : ''}" data-page="${p}" aria-label="Page ${p}">${p}</button>`
            ).join('')}
            <button class="page-btn page-next" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}" aria-label="Next page">&#8250;</button>
        </nav>
    `;

    wrap.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = parseInt(btn.dataset.page);
            renderBooks(getFilteredBooks());
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

/* Initial render — collection page fetches from backend; author page uses data.js */
async function initCollectionPage() {
    try {
        const res = await fetch('/books');
        if (res.ok) {
            _backendBooks = await res.json();
        }
    } catch (_) {
        /* backend offline — fall back to data.js Books */
    }
    renderBooks(getFilteredBooks());
}

if (container && document.querySelector('.collection-page')) {
    initCollectionPage();
} else if (container && typeof Books !== 'undefined') {
    renderBooks(getFilteredBooks());
}

/* ── Genre filter chips ──────────────────────────────────────── */
/* data-genre attribute on each <a> drives the activeGenre state */
const filterLinks = document.querySelectorAll('#expandBox .line a');
if (filterLinks.length > 0) {
    // Update active filter chip to match activeGenre
    filterLinks.forEach(link => {
        const linkGenre = link.dataset.genre || 'all';
        if (linkGenre === activeGenre) {
            link.classList.add('filter-active');
        } else {
            link.classList.remove('filter-active');
        }
    });

    filterLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            filterLinks.forEach(l => l.classList.remove('filter-active'));
            e.currentTarget.classList.add('filter-active');
            activeGenre = e.currentTarget.dataset.genre || 'all';
            currentPage = 1;
            renderBooks(getFilteredBooks());
        });
    });
}

/* ── Sort dropdown ───────────────────────────────────────────── */
/* Block-scoped to avoid const collisions with script.js */
{
    const sortBtn   = document.getElementById('sortBtn');
    const sortPanel = document.getElementById('sortPanel');
    if (sortBtn && sortPanel) {
        // Toggle panel open
        sortBtn.addEventListener('click', e => {
            e.stopPropagation();
            sortPanel.classList.toggle('open');
        });
        // Pick a sort option
        sortPanel.querySelectorAll('a[data-sort]').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                activeSort = e.currentTarget.dataset.sort;
                currentPage = 1;
                sortPanel.classList.remove('open');
                const labels = {
                    'default':    'Sort by ▾',
                    'price-asc':  'Price: Low → High ▾',
                    'price-desc': 'Price: High → Low ▾',
                    'title':      'Title A–Z ▾'
                };
                sortBtn.textContent = labels[activeSort] || 'Sort by ▾';
                renderBooks(getFilteredBooks());
            });
        });
        // Close when clicking outside
        document.addEventListener('click', e => {
            if (!sortBtn.contains(e.target) && !sortPanel.contains(e.target))
                sortPanel.classList.remove('open');
        });
    }
}

/* ── Live search ─────────────────────────────────────────────── */
/* Filters by title, author, or genre as the user types */
{
    const collectionSearch = document.querySelector('.collection-search-wrap .search-input');
    if (collectionSearch) {
        collectionSearch.addEventListener('input', () => {
            searchQuery = collectionSearch.value.trim().toLowerCase();
            currentPage = 1;
            renderBooks(getFilteredBooks());
        });
    }
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 4 — AUTHOR PAGE: scroll effects
   Fades the hero text and slowly zooms the background
   photo as the user scrolls down.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
window.addEventListener('scroll', function () {
    const scrollPos   = window.scrollY;
    const heroContent = document.querySelector('.authorPhoto-content');
    const heroBg      = document.querySelector('.authorPhoto-bg');

    // Fade out the author name as the user scrolls
    if (heroContent) {
        const opacity = 1 - (scrollPos / 300);
        heroContent.style.opacity = opacity >= 0 ? opacity : 0;
    }

    // Subtle zoom / parallax on the hero photo
    if (heroBg) {
        heroBg.style.transform = 'scale(' + (1 + scrollPos / 2000) + ')';
    }
});

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 5 — AUTHOR PAGE: data rendering
   Populates the author banner, about section, top-rated
   books row, and the recent books grid from authorData.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/* Converts a string to a URL-safe slug (e.g. "Gabriel García Márquez" → "gabriel-garcia-marquez") */
function normalizeSlug(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/* Strips all non-alphanumeric chars for loose title matching */
function normalizeTitle(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/* Finds a book by exact title then falls back to normalised match */
function resolveBookByTitle(title) {
    if (!Array.isArray(Books)) return null;
    const exact = Books.find(book => book.title === title);
    if (exact) return exact;
    const token = normalizeTitle(title);
    return Books.find(book => normalizeTitle(book.title) === token) || null;
}

/* Builds the product page URL for a given title */
function getProductUrl(title) {
    return `/book/${normalizeSlug(title)}`;
}

/* Adds a book to the cart localStorage array (increments qty if already present) */
function addBookToCart(book) {
    if (!book) return;
    const cart         = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.title === book.title);
    if (existingItem) {
        existingItem.qty = (existingItem.qty || 1) + 1;
    } else {
        cart.push({ ...book, qty: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
}

/* Looks up an author's data object by URL id param, with slug aliases */
function getAuthorDataById(authorId) {
    if (!authorId || typeof authorData !== 'object') return null;
    if (authorData[authorId]) return authorData[authorId];

    // Slug aliases for authors whose keys differ from their URL id
    const aliasMap = {
        'ernest-hemingway': 'hemingway',
        'leo-tolstoy':      'tolstoy',
        'terry-pratchett':  'pratchett',
        'nora-roberts':     'nora-roberts'
    };

    const aliasedKey = aliasMap[authorId];
    if (aliasedKey && authorData[aliasedKey]) return authorData[aliasedKey];

    // Last resort: normalise and compare all keys
    const target     = normalizeSlug(authorId);
    const matchedKey = Object.keys(authorData).find(key => normalizeSlug(key) === target);
    return matchedKey ? authorData[matchedKey] : null;
}

/* Returns up to 9 books by this author (or any books as fallback) */
function getRecentBooksForAuthor(authorName) {
    if (!Array.isArray(Books)) return [];
    if (!authorName) return Books.slice(0, 9);
    const lower       = authorName.toLowerCase();
    const authorBooks = Books.filter(book => String(book.author || '').toLowerCase() === lower);
    return (authorBooks.length > 0 ? authorBooks : Books).slice(0, 9);
}

/* Renders the recent-books-grid on the author page */
function renderRecentBooks(authorName) {
    const grid = document.getElementById('recent-books-grid');
    if (!grid || !Array.isArray(Books)) return;

    const basePath      = window.location.pathname.includes('/pages/') ? '../../' : './';
    const booksToRender = getRecentBooksForAuthor(authorName);

    grid.innerHTML = booksToRender.map(book => {
        const price          = Number(book.price);
        const formattedPrice = Number.isFinite(price) ? `$${price.toFixed(2)}` : `$${book.price}`;
        const subLine        = `${book.genre} / ${book.year}`;
        const productUrl     = getProductUrl(book.title);
        const imgSrc         = book.image.startsWith('http') ? book.image : `${basePath}${book.image}`;
        return `
            <article class="recent-book-card">
                <a class="recent-book-link" href="${productUrl}">
                    <div class="recent-book-header">
                        <h3 class="recent-book-title">${book.title}</h3>
                    </div>
                    <div class="recent-book-image-wrap">
                        <img src="${imgSrc}" alt="${book.title}">
                    </div>
                </a>
                <p class="recent-book-subline">${subLine}</p>
                <div class="recent-book-meta">
                    <div>
                        <p class="recent-book-price">${formattedPrice}</p>
                    </div>
                    <button class="recent-book-add" data-title="${book.title}"
                            type="button" aria-label="Add ${book.title} to cart">+</button>
                </div>
            </article>
        `;
    }).join('');

    // Wire up the + buttons after HTML is injected
    grid.querySelectorAll('.recent-book-add').forEach(button => {
        button.addEventListener('click', () => {
            const selectedBook = Books.find(book => book.title === button.dataset.title);
            addBookToCart(selectedBook);
        });
    });
}

/* ── Author page: populate all sections from authorData ─────── */
window.addEventListener('load', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const authorId  = urlParams.get('id');
    const data      = getAuthorDataById(authorId);

    if (data) {
        // Banner + about section text
        document.getElementById('author-name-heading').textContent  = data.name;
        document.getElementById('author-stats-sub').textContent     = data.stats;
        document.getElementById('about-title').textContent          = data.aboutTitle;
        document.getElementById('about-description').textContent    = data.aboutText;

        const banner = document.getElementById('dynamic-banner');
        if (banner) {
            banner.style.backgroundImage =
                `linear-gradient(to top, rgba(0,0,0,0.8), transparent), url('${data.bannerImg}')`;
        }

        const aboutImg = document.getElementById('about-img');
        if (aboutImg) aboutImg.src = data.profileImg;

        // Top-rated books row (horizontal scroll strip)
        const bookRow = document.getElementById('books-container');
        if (bookRow && Array.isArray(data.books)) {
            bookRow.innerHTML = '';
            data.books.forEach(book => {
                const matchedBook = resolveBookByTitle(book.title);
                const targetTitle = matchedBook ? matchedBook.title : book.title;
                const productUrl  = getProductUrl(targetTitle);
                bookRow.insertAdjacentHTML('beforeend', `
                    <div class="book-container">
                        <a href="${productUrl}" class="book-link">
                            <img src="${book.cover}" class="book-img" alt="${book.title}">
                        </a>
                        <div class="book-infosss">
                            <a href="${productUrl}" class="book-link">
                                <div class="book-name">${book.title}</div>
                            </a>
                            <div class="rating-row">
                                <span class="star-icon">★</span>
                                <span class="rating-num">${book.rating || '4.5'}</span>
                                <span class="review-count">· ${book.reviews || '1 m'} reviews</span>
                            </div>
                        </div>
                    </div>
                `);
            });
        }
    }

    // Recent books grid (below the about section)
    renderRecentBooks(data ? data.name : null);
});
