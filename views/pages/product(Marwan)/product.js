/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   product.js — drives the product detail page
   Depends on: data.js (Books array), product.html, product.css
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/* ── Fly-to-cart animation ─────────────────────────────────────
   Clones a small dark rectangle from the source element (book
   cover) and transitions it to the navbar cart icon.
   The cart icon then bounces via the .cart-bounce CSS class.
──────────────────────────────────────────────────────────────── */
function flyToCart(sourceEl) {
    const cartIcon = document.querySelector('.navbar-icons a .material-symbols-outlined');
    if (!cartIcon || !sourceEl) return;

    const srcRect = sourceEl.getBoundingClientRect();
    const dstRect = cartIcon.getBoundingClientRect();

    // Create the flying element (book-shaped rectangle)
    const el = document.createElement('div');
    el.className = 'fly-item';
    el.style.left = (srcRect.left + srcRect.width  / 2 - 19) + 'px';
    el.style.top  = (srcRect.top  + srcRect.height / 2 - 26) + 'px';
    document.body.appendChild(el);

    // Double rAF ensures the initial position is painted before transition starts
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

    // Once the element arrives, bounce the cart icon then clean up
    setTimeout(() => {
        el.remove();
        cartIcon.classList.add('cart-bounce');
        setTimeout(() => cartIcon.classList.remove('cart-bounce'), 600);
    }, 640);
}

/* ── Page initialisation ───────────────────────────────────────
   Everything runs inside DOMContentLoaded so the DOM is ready
   and the Books array from data.js is available.
──────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {

    /* ── Slug helper (mirrors catalog.js normalizeSlug) ── */
    function toSlug(s) {
        return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    /* ── Resolve book — supports clean /book/:slug and legacy ?title= ── */
    const pathMatch = window.location.pathname.match(/\/book\/([^/]+)$/);
    const slug      = pathMatch ? pathMatch[1] : null;
    const params    = new URLSearchParams(window.location.search);
    const bookTitle = decodeURIComponent(params.get('title') || '');

    /* Images are always served from the root regardless of URL shape */
    const basePath = '/';

    let selectedBook = null;

    if (slug) {
        try {
            const res = await fetch(`/books/slug/${encodeURIComponent(slug)}`);
            if (res.ok) selectedBook = await res.json();
        } catch (_) {}
        if (!selectedBook && typeof Books !== 'undefined') {
            selectedBook = Books.find(b => toSlug(b.title) === slug) || null;
        }
    } else if (bookTitle) {
        try {
            const res = await fetch(`/books/title/${encodeURIComponent(bookTitle)}`);
            if (res.ok) selectedBook = await res.json();
        } catch (_) {}
        if (!selectedBook && typeof Books !== 'undefined') {
            selectedBook = Books.find(b => b.title === bookTitle) || null;
        }
    }

    if (!selectedBook) {
        document.querySelector('.product-page').innerHTML =
            "<h1 style='padding:140px 40px;font-family:Jost,sans-serif;'>Book not found.</h1>";
        return;
    }

    const saleBook = (window.MKSale && window.MKSale.decorateBook)
        ? window.MKSale.decorateBook(selectedBook)
        : selectedBook;
    const mainPriceMarkup = (window.MKSale && window.MKSale.buildPriceMarkup)
        ? window.MKSale.buildPriceMarkup(selectedBook, { prefix: 'L.E ', badge: false })
        : { html: `L.E ${Number(selectedBook.price).toFixed(2)}`, hasSale: false };
    const hasSaleBadge = (window.MKSale && window.MKSale.buildPriceMarkup)
        ? window.MKSale.buildPriceMarkup(selectedBook, { prefix: 'L.E ', badge: true }).hasSale
        : false;

    /* ── Populate static book data ─────────────────────────────── */
    document.getElementById('main-title').innerText        = selectedBook.title;
    const authorSlug = toSlug(selectedBook.author);
    document.getElementById('main-author').innerHTML = `<a href="/author/${authorSlug}" style="color:inherit;text-decoration:none;border-bottom:1px solid currentColor;cursor:pointer;">${selectedBook.author}</a>`;
    document.getElementById('main-price').innerHTML        = mainPriceMarkup.html;
    document.getElementById('main-description').innerText  = selectedBook.description;
    document.getElementById('main-quote').innerText        = `"${selectedBook.quote}"`;
    const imgEl  = document.getElementById('main-image');
    imgEl.src    = selectedBook.image.startsWith('http') ? selectedBook.image : basePath + selectedBook.image;
    imgEl.alt    = selectedBook.title;
    document.getElementById('main-year').innerText         = selectedBook.year;
    document.getElementById('main-pages').innerText        = `${selectedBook.pages} pages`;
    document.getElementById('main-language').innerText     = selectedBook.language;
    document.getElementById('main-ISBN').innerText         = selectedBook.ISBN;
    document.getElementById('main-genre').innerText        = selectedBook.genre;

    /* ── Star rating ───────────────────────────────────────────── */
    const ratingEl = document.querySelector('.product-rating');
    if (ratingEl && selectedBook.averageRating != null) {
        const r    = Math.max(0, Math.min(5, parseFloat(selectedBook.averageRating) || 0));
        const full = Math.floor(r);
        ratingEl.innerHTML = `${'★'.repeat(full)}${'☆'.repeat(5 - full)} <span>(${r.toFixed(1)})</span>`;
    }

    /* ── Availability badge ────────────────────────────────────── */
    /* Use stock count (from DB) or fall back to the legacy available flag */
    const availabilityEl = document.getElementById('main-availability');
    const isInStock = typeof selectedBook.stock === 'number'
        ? selectedBook.stock > 0
        : Boolean(selectedBook.available);
    if (isInStock) {
        availabilityEl.innerHTML =
            '<span class="availability-badge availability-in-stock">In Stock</span>';
    } else {
        availabilityEl.innerHTML =
            '<span class="availability-badge availability-out-of-stock">Out of Stock</span>';
    }

    /* ── Favourite heart icon ──────────────────────────────────────
       Reads / writes a JSON array of book titles in localStorage.
       The 'FILL' font-variation-settings fills the Material Symbol.
    ──────────────────────────────────────────────────────────────── */
    const coverStage = document.querySelector('.product-cover-stage');
    if (coverStage) {
        coverStage.style.position = 'relative';
        let saleBadge = coverStage.querySelector('.product-sale-badge');
        if (hasSaleBadge) {
            if (!saleBadge) {
                saleBadge = document.createElement('span');
                saleBadge.className = 'product-sale-badge';
                saleBadge.style.cssText = 'position:absolute;top:14px;right:14px;z-index:2;background:#9f3d35;color:#fff;font:700 11px/1 Jost,system-ui,sans-serif;letter-spacing:.08em;padding:9px 11px;text-transform:uppercase;border-radius:0;box-shadow:0 10px 24px rgba(0,0,0,.14);';
                coverStage.appendChild(saleBadge);
            }
            saleBadge.textContent = saleBook.salePercent > 0 ? `${saleBook.salePercent}% OFF` : 'ON SALE';
        } else if (saleBadge) {
            saleBadge.remove();
        }
    }

    const favoriteIcon = document.getElementById('favorite-icon');

    const getFavorites  = ()      => JSON.parse(localStorage.getItem('favorites') || '[]');
    const saveFavorites = (favs)  => localStorage.setItem('favorites', JSON.stringify(favs));

    function updateHeartUI(isFav) {
        if (isFav) {
            favoriteIcon.classList.add('filled');
            favoriteIcon.style.fontVariationSettings = "'FILL' 1, 'wght' 700";
            favoriteIcon.style.color = '#e74c3c';
        } else {
            favoriteIcon.classList.remove('filled');
            favoriteIcon.style.fontVariationSettings = "'FILL' 0, 'wght' 400";
            favoriteIcon.style.color = '';
        }
    }

    updateHeartUI(getFavorites().includes(selectedBook.title));

    favoriteIcon.addEventListener('click', () => {
        let favs = getFavorites();
        const idx = favs.indexOf(selectedBook.title);
        if (idx === -1) {
            favs.push(selectedBook.title);
            saveFavorites(favs);
            try {
                const fc = JSON.parse(localStorage.getItem('mktFavData') || '{}');
                fc[selectedBook.title] = (window.MKSale && window.MKSale.toFavoriteCache)
                    ? window.MKSale.toFavoriteCache(selectedBook)
                    : { image: selectedBook.image, author: selectedBook.author, price: selectedBook.price, genre: selectedBook.genre };
                localStorage.setItem('mktFavData', JSON.stringify(fc));
            } catch (_) {}
            updateHeartUI(true);
            // Pop animation
            favoriteIcon.style.transform = 'scale(1.5)';
            setTimeout(() => { favoriteIcon.style.transform = 'scale(1)'; }, 220);
        } else {
            favs.splice(idx, 1);
            saveFavorites(favs);
            updateHeartUI(false);
        }
    });

    /* ── Cart helpers ──────────────────────────────────────────── */
    function addBookToCart() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existing = cart.find(item => item.title === selectedBook.title);
        const incoming = (window.MKSale && window.MKSale.toCartItem)
            ? window.MKSale.toCartItem(Object.assign({}, saleBook, { qty: 1 }))
            : {
                title:  selectedBook.title,
                author: selectedBook.author,
                price:  selectedBook.price,
                image:  selectedBook.image,
                qty:    1
            };
        if (existing) {
            const nextQty = (existing.qty || 1) + 1;
            const currentPrice = parseFloat(existing.price) || 0;
            const incomingPrice = parseFloat(incoming.price) || 0;
            if (!currentPrice || (incomingPrice > 0 && incomingPrice < currentPrice)) {
                Object.assign(existing, incoming);
            }
            existing.qty = nextQty;
        } else {
            cart.push(incoming);
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        return existing ? existing.qty : 1;
    }

    /* ── Add to Cart button ────────────────────────────────────── */
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    addToCartBtn.addEventListener('click', () => {
        const qty = addBookToCart();
        const original = addToCartBtn.textContent;

        flyToCart(document.getElementById('main-image'));

        addToCartBtn.textContent = `Added (${qty})`;
        addToCartBtn.style.background = '#e8f5e9';
        addToCartBtn.style.borderColor = '#4caf50';
        addToCartBtn.style.color = '#2e7d32';

        setTimeout(() => {
            addToCartBtn.textContent      = original;
            addToCartBtn.style.background  = '';
            addToCartBtn.style.borderColor = '';
            addToCartBtn.style.color       = '';
        }, 1600);
    });

    /* ── Buy Now button ────────────────────────────────────────── */
    document.querySelector('.buy-now-btn').addEventListener('click', () => {
        const token = localStorage.getItem('maktabaToken');
        if (!token) {
            window.location.href = '/signin';
            return;
        }
        addBookToCart();
        window.location.href = '/checkout';
    });

    /* ── Share button ──────────────────────────────────────────────
       Uses the native Web Share API when available (mobile/Chrome).
       Falls back to copying the URL to clipboard on desktop.
    ──────────────────────────────────────────────────────────────── */
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const url  = window.location.href;
            const text = `Check out "${selectedBook.title}" by ${selectedBook.author}`;

            if (navigator.share) {
                try {
                    await navigator.share({ title: selectedBook.title, text, url });
                } catch (e) {
                    // User cancelled share — do nothing
                }
            } else {
                // Clipboard fallback — show tooltip confirmation
                try {
                    await navigator.clipboard.writeText(url);
                } catch (e) {
                    // Older browsers: execCommand fallback
                    const ta = document.createElement('textarea');
                    ta.value = url;
                    ta.style.position = 'fixed';
                    ta.style.opacity  = '0';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    ta.remove();
                }
                shareBtn.classList.add('copied');
                shareBtn.querySelector('.material-symbols-outlined').textContent = 'check';
                setTimeout(() => {
                    shareBtn.classList.remove('copied');
                    shareBtn.querySelector('.material-symbols-outlined').textContent = 'share';
                }, 2200);
            }
        });
    }

    /* ── "More Like This" — fetches same-genre books from the DB ── */
    const suggestedBooksContainer = document.getElementById('suggested-books');
    if (suggestedBooksContainer) {
        const moreTitleEl = document.getElementById('more-section-title');
        if (moreTitleEl) moreTitleEl.textContent = `More ${selectedBook.genre}`;

        let pool = [];
        try {
            const res = await fetch(`/books?genre=${encodeURIComponent(selectedBook.genre)}`);
            if (res.ok) {
                const data = await res.json();
                const all = Array.isArray(data) ? data : (data.books || []);
                pool = all.filter(b => b.title !== selectedBook.title);
            }
        } catch (_) {}

        // Fallback to static Books array if API returned nothing
        if (pool.length === 0 && typeof Books !== 'undefined') {
            pool = Books.filter(b => b.genre === selectedBook.genre && b.title !== selectedBook.title);
        }

        // Fisher-Yates shuffle so order varies on each load
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        if (pool.length === 0) {
            suggestedBooksContainer.innerHTML =
                '<p style="font-family:Jost,sans-serif;font-size:12px;color:#8C7B75;">No similar books found.</p>';
        } else {
            suggestedBooksContainer.innerHTML = pool.slice(0, 8).map(book => {
                const img = book.image
                    ? (book.image.startsWith('http') ? book.image : basePath + book.image)
                    : '';
                return `
                <a href="/book/${toSlug(book.title)}" class="suggested-book">
                    <img src="${img}" alt="${book.title}">
                    <div class="suggested-book-title">${book.title}</div>
                </a>`;
            }).join('');
        }
    }

    /* ── Reviews — loaded from DB only, empty state if none ── */
    function fmtDate(iso) {
        try { return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
        catch(_) { return iso || ''; }
    }

    async function fetchAndRenderReviews() {
        const grid = document.getElementById('reviews-grid');
        if (!grid) return;
        let dbReviews = [];
        if (selectedBook._id) {
            try {
                const res = await fetch(`/books/${selectedBook._id}/reviews`);
                if (res.ok) dbReviews = await res.json();
            } catch(_) {}
        }
        if (dbReviews.length === 0) {
            grid.innerHTML = '<div style="text-align:center;padding:48px 0;font-family:Jost,sans-serif;color:#8C7B75;font-size:14px;letter-spacing:0.03em;border-top:1px solid #d9d0c4;">No reviews yet — be the first to share your thoughts!</div>';
            return;
        }
        grid.innerHTML = dbReviews.map(r => {
            const rating = r.rating || 5;
            const stars  = '★'.repeat(rating) + '☆'.repeat(5 - rating);
            const name   = (r.reviewer && r.reviewer.name) ? r.reviewer.name : (r.reviewer || r.author || 'Anonymous');
            const text   = r.comment  || r.text   || '';
            const date   = fmtDate(r.createdAt || r.date);
            return `
                <div class="review-card">
                    <div class="review-header">
                        <span class="review-author">${name}</span>
                        <span class="review-rating">${stars}</span>
                    </div>
                    <p class="review-text">${text}</p>
                    <div class="review-date">${date}</div>
                </div>`;
        }).join('');
    }

    fetchAndRenderReviews();

    /* ── Write a Review — requires sign-in ──────────────────────── */
    const writeReviewBtn  = document.querySelector('.write-review-btn');
    const reviewFormPanel = document.getElementById('review-form-panel');

    if (writeReviewBtn && reviewFormPanel) {
        writeReviewBtn.addEventListener('click', () => {
            const token = localStorage.getItem('maktabaToken');
            if (!token) {
                sessionStorage.setItem('mkFlashToast', 'Please sign in to write a review.');
                window.location.href = '/signin';
                return;
            }
            const isOpen = reviewFormPanel.classList.toggle('open');
            writeReviewBtn.textContent = isOpen ? 'Cancel' : 'Write a Review';
            if (isOpen) document.getElementById('review-form-error').textContent = '';
        });

        document.getElementById('submit-review-btn').addEventListener('click', async () => {
            const text        = document.getElementById('review-text-input').value.trim();
            const ratingInput = document.querySelector('input[name="rating"]:checked');
            const rating      = ratingInput ? parseInt(ratingInput.value) : 5;
            const errEl       = document.getElementById('review-form-error');

            const token = localStorage.getItem('maktabaToken');
            if (!token) {
                errEl.textContent = 'Please sign in to submit a review.';
                return;
            }
            if (!text) {
                errEl.textContent = 'Please write your review before submitting.';
                return;
            }
            if (!selectedBook._id) {
                errEl.textContent = 'Cannot submit review — book ID not found.';
                return;
            }
            errEl.textContent = '';

            const userName = localStorage.getItem('maktabaUserName') || 'Reader';

            try {
                const res = await fetch(`/books/${selectedBook._id}/reviews`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body:    JSON.stringify({ rating, reviewer: userName, comment: text })
                });
                const data = await res.json();
                if (!res.ok) {
                    errEl.textContent = data.error || 'Could not submit review.';
                    return;
                }
                document.getElementById('review-text-input').value = '';
                reviewFormPanel.classList.remove('open');
                writeReviewBtn.textContent = 'Write a Review';
                await fetchAndRenderReviews();
            } catch(_) {
                errEl.textContent = 'Network error — please try again.';
            }
        });
    }

}); // end DOMContentLoaded
