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
document.addEventListener('DOMContentLoaded', () => {

    /* ── Resolve book from URL parameter ── */
    const params    = new URLSearchParams(window.location.search);
    const bookTitle = decodeURIComponent(params.get('title') || '');
    const basePath  = window.location.pathname.includes('/pages/') ? '../../' : './';

    if (!bookTitle || typeof Books === 'undefined') return;

    const selectedBook = Books.find(b => b.title === bookTitle);

    if (!selectedBook) {
        document.querySelector('.product-page').innerHTML =
            "<h1 style='padding:140px 40px;font-family:Jost,sans-serif;'>Book not found.</h1>";
        return;
    }

    /* ── Populate static book data ─────────────────────────────── */
    document.getElementById('main-title').innerText        = selectedBook.title;
    document.getElementById('main-author').innerText       = selectedBook.author;
    document.getElementById('main-price').innerText        = `€${selectedBook.price}`;
    document.getElementById('main-description').innerText  = selectedBook.description;
    document.getElementById('main-quote').innerText        = `"${selectedBook.quote}"`;
    document.getElementById('main-image').src              = basePath + selectedBook.image;
    document.getElementById('main-image').alt              = selectedBook.title;
    document.getElementById('main-year').innerText         = selectedBook.year;
    document.getElementById('main-pages').innerText        = `${selectedBook.pages} pages`;
    document.getElementById('main-language').innerText     = selectedBook.language;
    document.getElementById('main-ISBN').innerText         = selectedBook.ISBN;
    document.getElementById('main-genre').innerText        = selectedBook.genre;

    /* ── Availability badge ────────────────────────────────────── */
    const availabilityEl = document.getElementById('main-availability');
    if (selectedBook.available) {
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
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (!cart.find(item => item.title === selectedBook.title)) {
            cart.push({
                title:  selectedBook.title,
                author: selectedBook.author,
                price:  selectedBook.price,
                image:  selectedBook.image,
                qty:    1
            });
            localStorage.setItem('cart', JSON.stringify(cart));
            return true; // newly added
        }
        return false; // already in cart
    }

    /* ── Add to Cart button ────────────────────────────────────── */
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    addToCartBtn.addEventListener('click', () => {
        const added   = addBookToCart();
        const original = addToCartBtn.textContent;

        // Fly the book cover to the cart icon
        flyToCart(document.getElementById('main-image'));

        // Brief button feedback
        addToCartBtn.textContent     = added ? '✓ Added' : 'Already in Cart';
        addToCartBtn.style.background = added ? '#e8f5e9' : '#fff8e1';
        addToCartBtn.style.borderColor = added ? '#4caf50' : '#ffc107';
        addToCartBtn.style.color       = added ? '#2e7d32' : '#b8860b';

        setTimeout(() => {
            addToCartBtn.textContent      = original;
            addToCartBtn.style.background  = '';
            addToCartBtn.style.borderColor = '';
            addToCartBtn.style.color       = '';
        }, 1600);
    });

    /* ── Buy Now button ────────────────────────────────────────── */
    document.querySelector('.buy-now-btn').addEventListener('click', () => {
        addBookToCart();
        window.location.href = basePath + 'pages/checkout(Rojeh)/checkout.html';
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

    /* ── "More Like This" full-width floating books row ────────────
       Shows same-genre books first, then fills with books from
       closely related genres. A genre-similarity map defines
       which genres count as "related". Books are shuffled within
       each group so the row varies on every page load.
    ──────────────────────────────────────────────────────────────── */
    const suggestedBooksContainer = document.getElementById('suggested-books');
    if (suggestedBooksContainer) {

        // Only books from the exact same genre, excluding the current one
        const pool = Books.filter(b => b.genre === selectedBook.genre && b.title !== selectedBook.title);

        // Fisher-Yates shuffle so order varies on each load
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        // Update the section heading with the current genre
        const moreTitleEl = document.getElementById('more-section-title');
        if (moreTitleEl) moreTitleEl.textContent = `More ${selectedBook.genre}`;

        if (pool.length === 0) {
            suggestedBooksContainer.innerHTML =
                '<p style="font-family:Jost,sans-serif;font-size:12px;color:#8C7B75;">No similar books found.</p>';
        } else {
            suggestedBooksContainer.innerHTML = pool.slice(0, 8).map(book => `
                <a href="product.html?title=${encodeURIComponent(book.title)}" class="suggested-book">
                    <img src="${basePath}${book.image}" alt="${book.title}">
                    <div class="suggested-book-title">${book.title}</div>
                </a>
            `).join('');
        }
    }

    /* ── Reviews ───────────────────────────────────────────────────
       Per-book reviews are stored in localStorage under
       'reviews__<title>'. Static reviews are appended so there is
       always some content even for new books.
    ──────────────────────────────────────────────────────────────── */
    const REVIEW_KEY  = 'reviews__' + selectedBook.title;
    const getReviews  = ()  => JSON.parse(localStorage.getItem(REVIEW_KEY) || '[]');
    const saveReviews = (r) => localStorage.setItem(REVIEW_KEY, JSON.stringify(r));

    const STATIC_REVIEWS = [
        { author: 'Elena M.',  rating: 5, text: "Absolutely loved this! The story pulled me in from the very first page and didn't let go until the end.", date: 'October 12, 2025' },
        { author: 'David K.',  rating: 4, text: 'Great read overall. The characters were well-developed, though the middle dragged a bit. Still very solid.', date: 'September 28, 2025' }
    ];

    function renderReviews() {
        const grid = document.getElementById('reviews-grid');
        if (!grid) return;
        const all = [...getReviews(), ...STATIC_REVIEWS];
        grid.innerHTML = all.map(r => {
            const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
            return `
                <div class="review-card">
                    <div class="review-header">
                        <span class="review-author">${r.author}</span>
                        <span class="review-rating">${stars}</span>
                    </div>
                    <p class="review-text">${r.text}</p>
                    <div class="review-date">${r.date}</div>
                </div>`;
        }).join('');
    }

    renderReviews();

    /* ── Write a Review form toggle ─────────────────────────────── */
    const writeReviewBtn  = document.querySelector('.write-review-btn');
    const reviewFormPanel = document.getElementById('review-form-panel');

    if (writeReviewBtn && reviewFormPanel) {
        // Toggle the form panel open / closed
        writeReviewBtn.addEventListener('click', () => {
            const isOpen = reviewFormPanel.classList.toggle('open');
            writeReviewBtn.textContent = isOpen ? 'Cancel' : 'Write a Review';
        });

        // Submit the review
        document.getElementById('submit-review-btn').addEventListener('click', () => {
            const text        = document.getElementById('review-text-input').value.trim();
            const ratingInput = document.querySelector('input[name="rating"]:checked');
            const rating      = ratingInput ? parseInt(ratingInput.value) : 5;

            if (!text) {
                document.getElementById('review-form-error').textContent =
                    'Please write your review before submitting.';
                return;
            }
            document.getElementById('review-form-error').textContent = '';

            const reviews = getReviews();
            reviews.unshift({
                author: 'You',
                rating,
                text,
                date: new Date().toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                })
            });
            saveReviews(reviews);
            renderReviews();

            // Reset form
            document.getElementById('review-text-input').value = '';
            reviewFormPanel.classList.remove('open');
            writeReviewBtn.textContent = 'Write a Review';
        });
    }

}); // end DOMContentLoaded
