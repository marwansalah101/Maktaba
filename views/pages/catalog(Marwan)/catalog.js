/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   catalog.js — shared script for genre, collection, and author pages
   Depends on: data.js (Books, authorData), catalog.css
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SECTION 1 — GENRE PAGE
   Renders the editorial genre grid from a static list,
   then initialises the AI panel. The AI fetches the live
   book catalogue from the DB so it can match any request
   ("I want a book about love") to real titles in stock.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
(function initGenrePage() {
    var genreGrid = document.getElementById('genreGrid');
    if (!genreGrid) return;

    /* Static genre definitions — order = editorial card position */
    var GENRES = [
        { name: 'Fantasy',          tag: 'Magical Worlds', img: 'https://static01.nyt.com/images/2019/05/22/arts/21thrones-notebook1/21thrones-notebook1-videoSixteenByNineJumbo1600-v2.jpg' },
        { name: 'Horror',           tag: 'Dark Fiction',   img: '../../resources/img/Horror.png'    },
        { name: 'Thriller',         tag: 'Suspense',       img: '../../resources/img/Thriller.png'  },
        { name: 'Science Fiction',  tag: 'Future Worlds',  img: '../../resources/img/Scifi.png'     },
        { name: 'Adventure',        tag: 'Journey',        img: '../../resources/img/Adventure.png' },
        { name: 'Drama',            tag: 'Human Stories',  img: '../../resources/img/Drama.png'     },
    ];

    /* ── Render static genre grid ────────────────────────────── */
    var arrowSvg =
        '<svg width="22" height="9" viewBox="0 0 22 9" fill="none" aria-hidden="true">' +
        '<path d="M0 4.5H20M16 1l4 3.5-4 3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>';

    genreGrid.innerHTML = '';
    GENRES.forEach(function (genre, i) {
        var num     = String(i + 1).padStart(2, '0');
        var encoded = encodeURIComponent(genre.name);
        var isLast  = i === 5;

        var innerContent = isLast
            ? '<div class="gc-info">' +
                  '<span class="gc-tag">' + genre.tag + '</span>' +
                  '<h2 class="gc-name">' + genre.name + '</h2>' +
              '</div>' +
              '<div class="gc-explore">' + arrowSvg + '<span>Explore</span></div>'
            : '<span class="gc-tag">' + genre.tag + '</span>' +
              '<h2 class="gc-name">' + genre.name + '</h2>' +
              '<div class="gc-explore">' + arrowSvg + '<span>Explore</span></div>';

        var card = document.createElement('a');
        card.className = 'genre-card';
        card.href = './collection.html?genre=' + encoded;
        card.setAttribute('aria-label', 'Browse ' + genre.name + ' books');
        card.innerHTML =
            '<div class="gc-img" style="background-image: url(\'' + genre.img + '\')"></div>' +
            '<div class="gc-overlay"></div>' +
            '<div class="gc-accent"></div>' +
            '<span class="gc-num">' + num + '</span>' +
            '<div class="gc-content">' + innerContent + '</div>';

        genreGrid.appendChild(card);
    });

    var countEl = document.getElementById('glhCount');
    if (countEl) countEl.textContent = String(GENRES.length).padStart(2, '0');

    /* ── AI recommendation panel ─────────────────────────────── */
    var API_KEY  = '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';
    var MODEL    = 'openai/gpt-oss-120b';
    var ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

    var aiInput    = document.getElementById('aiInput');
    var submitBtn  = document.getElementById('aiSubmitBtn');
    var typingEl   = document.getElementById('aiTyping');
    var wrapperEl  = document.getElementById('aiResponseWrapper');
    var responseEl = document.getElementById('aiResponseText');

    if (!aiInput || !submitBtn) return;

    /* Fetch the live catalogue once so the AI can reference real titles */
    var dbBooks = [];
    fetch('http://localhost:3000/books')
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (d) { dbBooks = Array.isArray(d) ? d : []; })
        .catch(function () {});

    function setLoading(on) { submitBtn.disabled = on; aiInput.disabled = on; }
    function showTyping()   { typingEl.classList.add('visible'); wrapperEl.classList.remove('visible'); responseEl.innerHTML = ''; }
    function hideTyping()   { typingEl.classList.remove('visible'); }
    function revealResponse(){ wrapperEl.classList.add('visible'); }

    function appendChunk(text) {
        var cur = responseEl.querySelector('.ai-cursor');
        if (cur) cur.remove();
        responseEl.appendChild(document.createTextNode(text));
        var c = document.createElement('span');
        c.className = 'ai-cursor';
        responseEl.appendChild(c);
    }

    function finishStream() {
        var cur = responseEl.querySelector('.ai-cursor');
        if (cur) cur.remove();
    }

    function buildSystemPrompt() {
        var base =
            'You are a book recommendation assistant for Maktaba, an online bookstore. ' +
            'When the user describes what they want — a theme, mood, feeling, or topic (e.g. "a book about love", "something dark and scary", "an inspiring journey") — ' +
            'find the books from our catalogue that best match that description and recommend 3 to 5 of them. ' +
            'Use your knowledge of each book\'s themes, tone, and story to judge the fit, not just the genre label. ' +
            'For each recommendation give the title in quotes, the author, and one sentence explaining why it matches what the user asked for. ' +
            'Write in plain, warm prose. No bullet points, no markdown headers, no numbered lists.';

        if (dbBooks.length > 0) {
            var list = dbBooks
                .map(function (b) { return '"' + b.title + '" by ' + b.author + ' (' + b.genre + ')'; })
                .join(', ');
            base += ' Our full catalogue (only recommend from this list): ' + list + '.';
        }

        return base;
    }

    async function streamRecommendations(msg) {
        var res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + API_KEY,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.href,
                'X-Title': 'Maktaba'
            },
            body: JSON.stringify({
                model: MODEL, stream: true, max_tokens: 600,
                messages: [
                    { role: 'system', content: buildSystemPrompt() },
                    { role: 'user',   content: msg }
                ]
            })
        });

        if (!res.ok) throw new Error(res.status + ': ' + await res.text());

        var reader  = res.body.getReader();
        var decoder = new TextDecoder();
        var buffer  = '';
        var first   = true;

        while (true) {
            var chunk = await reader.read();
            if (chunk.done) break;
            buffer += decoder.decode(chunk.value, { stream: true });
            var lines = buffer.split('\n');
            buffer = lines.pop();
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (!line.startsWith('data: ')) continue;
                var raw = line.slice(6).trim();
                if (raw === '[DONE]') { finishStream(); return; }
                var parsed; try { parsed = JSON.parse(raw); } catch (e) { continue; }
                var content = parsed && parsed.choices && parsed.choices[0] &&
                              parsed.choices[0].delta && parsed.choices[0].delta.content;
                if (!content) continue;
                if (first) { hideTyping(); revealResponse(); first = false; }
                appendChunk(content);
            }
        }
        finishStream();
    }

    async function handleSubmit() {
        var msg = aiInput.value.trim();
        if (!msg) { aiInput.focus(); return; }
        showTyping(); setLoading(true);
        try {
            await streamRecommendations(msg);
        } catch (err) {
            hideTyping(); revealResponse();
            responseEl.innerHTML = '<span class="ai-error-msg">Something went wrong. Please try again.</span>';
            console.error('[Narrator]', err);
        } finally {
            setLoading(false);
        }
    }

    submitBtn.addEventListener('click', handleSubmit);
    aiInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSubmit(); }
    });
})();

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
const seeMoreBtn = document.getElementById('seeMoreBtn');

let activeGenre = 'all';
let activeSort  = 'default';
let searchQuery = '';
let visibleBookCount = 4;
let _backendBooks = null; /* populated by initCollectionPage() */

const BOOKS_PAGE_SIZE = 4;

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
    let books = _backendBooks ? [..._backendBooks]
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

/* Renders the full book grid — called on every filter/sort/search change */
function renderBooks(booksToRender) {
    if (!container) return;
    container.innerHTML = '';

    const visibleBooks = booksToRender.slice(0, visibleBookCount);

    // Update the "N Books" count label
    const countEl = document.getElementById('book-count');
    if (countEl) {
        const totalLabel = booksToRender.length + (booksToRender.length === 1 ? ' Book' : ' Books');
        countEl.textContent = visibleBooks.length < booksToRender.length
            ? `${visibleBooks.length} of ${totalLabel}`
            : totalLabel;
    }

    if (booksToRender.length === 0) {
        if (seeMoreBtn) seeMoreBtn.style.display = 'none';
        container.innerHTML =
            '<p style="grid-column:1/-1;text-align:center;padding:60px 0;font-family:Jost,sans-serif;font-size:14px;color:#8C7B75;">No books found.</p>';
        return;
    }

    const basePath = window.location.pathname.includes('/pages/') ? '../../' : './';

    visibleBooks.forEach(book => {
        const card        = document.createElement('div');
        card.classList.add('book-listing');

        const bookParam  = encodeURIComponent(book.title);
        const productUrl = `${basePath}pages/product(Marwan)/product.html?title=${bookParam}`;

        /* Card structure:
           - .book-rating-row  — star rating at the top
           - .book-cover-wrap  — linked book cover image
           - .book-meta        — genre tag, title link, author, price
           - .add-to-cart      — hidden until hover (CSS opacity trick)
        */
        card.innerHTML = `
          <div class="book-rating-row">
            <span class="book-stars">★★★★★</span>
            <span class="book-stars-count">(5)</span>
          </div>
          <a href="${productUrl}" class="book-cover-wrap book-link">
            <img class="book-cover" src="${basePath}${book.image}" alt="${book.title}">
          </a>
          <div class="book-meta">
            <p class="book-genre-tag">${book.genre}</p>
            <a href="${productUrl}" class="book-link">
              <h3 class="book-title">${book.title}</h3>
            </a>
            <p class="book-author">${book.author}</p>
            <p class="book-price">€${book.price}</p>
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

        container.appendChild(card);
    });

    if (seeMoreBtn) {
        const hasMore = visibleBooks.length < booksToRender.length;
        seeMoreBtn.style.display = hasMore ? 'inline-flex' : 'none';
        seeMoreBtn.disabled = !hasMore;
    }
}

/* Initial render — collection page fetches from backend; author page uses data.js */
async function initCollectionPage() {
    try {
        const res = await fetch('http://localhost:3000/books');
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
            visibleBookCount = BOOKS_PAGE_SIZE;
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
                visibleBookCount = BOOKS_PAGE_SIZE;
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
            visibleBookCount = BOOKS_PAGE_SIZE;
            renderBooks(getFilteredBooks());
        });
    }
}

if (seeMoreBtn) {
    seeMoreBtn.addEventListener('click', () => {
        visibleBookCount += BOOKS_PAGE_SIZE;
        renderBooks(getFilteredBooks());
    });
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

/* Converts a string to a URL-safe slug (e.g. "Ernest Hemingway" → "ernest-hemingway") */
function normalizeSlug(value) {
    return String(value || '')
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
    const productPath = window.location.pathname.includes('/pages/')
        ? '../product(Marwan)/product.html'
        : './pages/product(Marwan)/product.html';
    return `${productPath}?title=${encodeURIComponent(title)}`;
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
        return `
            <article class="recent-book-card">
                <a class="recent-book-link" href="${productUrl}">
                    <div class="recent-book-header">
                        <h3 class="recent-book-title">${book.title}</h3>
                    </div>
                    <div class="recent-book-image-wrap">
                        <img src="${basePath}${book.image}" alt="${book.title}">
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
