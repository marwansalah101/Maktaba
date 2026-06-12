const menuBtn = document.getElementById('menuBtn');
const menuDropdown = document.getElementById('menuDropdown');
const menuWrapper = document.querySelector('.menu-dropdown-wrapper');

if (menuBtn && menuDropdown && menuWrapper) {
    document.body.appendChild(menuDropdown);

    const positionDropdown = () => {
        const btnRect = menuBtn.getBoundingClientRect();
        const dropdownWidth = menuDropdown.offsetWidth || 160;
        menuDropdown.style.top = `${btnRect.bottom + 15}px`;
        menuDropdown.style.left = `${Math.max(12, btnRect.right - dropdownWidth)}px`;
    };

    const openDropdown = () => {
        menuDropdown.classList.add('open');
        positionDropdown();
    };

    const closeDropdown = () => menuDropdown.classList.remove('open');

    window.addEventListener('resize', positionDropdown);
    window.addEventListener('scroll', positionDropdown);

    let hoverTimeout;

    menuWrapper.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        openDropdown();
    });

    menuWrapper.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(closeDropdown, 400);
    });

    menuDropdown.addEventListener('mouseenter', () => clearTimeout(hoverTimeout));
    menuDropdown.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(closeDropdown, 400);
    });

    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.innerWidth <= 767) {
            const mob = document.getElementById('mkMobileMenu');
            if (mob) {
                if (mob.classList.contains('open')) {
                    mob.classList.remove('open');
                    mob.setAttribute('aria-hidden', 'true');
                    document.body.style.overflow = '';
                } else {
                    mob.classList.add('open');
                    mob.setAttribute('aria-hidden', 'false');
                    document.body.style.overflow = 'hidden';
                }
            }
            return;
        }
        if (menuDropdown.classList.contains('open')) {
            closeDropdown();
        } else {
            openDropdown();
        }
    });

    menuWrapper.addEventListener('click', (e) => e.stopPropagation());
    menuDropdown.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', closeDropdown);
}

/* ── Mobile full-screen navigation overlay ── */
(function () {
    const overlay = document.createElement('div');
    overlay.id = 'mkMobileMenu';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
        '<div class="mk-mob-head">' +
            '<span class="mk-mob-brand">Maktaba</span>' +
            '<button class="mk-mob-close" id="mkMobClose" aria-label="Close navigation">' +
                '<span class="material-symbols-outlined">close</span>' +
            '</button>' +
        '</div>' +
        '<nav class="mk-mob-nav">' +
            '<a class="mk-mob-link" href="/home">Home</a>' +
            '<a class="mk-mob-link" href="/browse">Browse</a>' +
            '<a class="mk-mob-link" href="/collection">Collection</a>' +
            '<a class="mk-mob-link" href="/favorites">Favourites</a>' +
        '</nav>' +
        '<div class="mk-mob-divider"></div>' +
        '<div class="mk-mob-secondary">' +
            '<a class="mk-mob-sec-link mk-mob-sec-link--ai" href="/browse#bw-ai-section">Maktaba AI ✶</a>' +
            '<a class="mk-mob-sec-link" href="/settings">Settings</a>' +
            '<a class="mk-mob-sec-link" href="/contact">Contact Us</a>' +
        '</div>' +
        '<div class="mk-mob-auth">' +
            '<a class="mk-mob-sec-link" id="mkMobAuthBtn" href="/signin">Sign In</a>' +
        '</div>';

    document.body.appendChild(overlay);

    document.getElementById('mkMobClose').addEventListener('click', function () {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('open')) {
            overlay.classList.remove('open');
            overlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    });
}());

const memoryCartStore = { cart: [] };

function flyToCart(sourceEl) {
    const cartIcon = document.querySelector('.navbar-icons a .material-symbols-outlined');
    if (!cartIcon || !sourceEl) return;

    const srcRect = sourceEl.getBoundingClientRect();
    const dstRect = cartIcon.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'fly-item';
    el.style.left = `${srcRect.left + srcRect.width / 2 - 19}px`;
    el.style.top = `${srcRect.top + srcRect.height / 2 - 26}px`;
    document.body.appendChild(el);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            el.style.left = `${dstRect.left + dstRect.width / 2 - 10}px`;
            el.style.top = `${dstRect.top + dstRect.height / 2 - 10}px`;
            el.style.width = '20px';
            el.style.height = '20px';
            el.style.opacity = '0';
            el.style.transform = 'scale(0.2)';
        });
    });

    setTimeout(() => {
        el.remove();
        cartIcon.classList.add('cart-bounce');
        setTimeout(() => cartIcon.classList.remove('cart-bounce'), 600);
    }, 640);
}
//Filters box
const btn = document.getElementById('toggleBtn');
const box = document.getElementById('expandBox');

if (btn && box) {
    btn.addEventListener('click', () => {
        box.classList.toggle('open');
    });
}
// Search button
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.querySelector('.search-input');

if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
    });
}
const BookSearchBtn = document.getElementById('BookSearchBtn');






/*order success*/
function getOrderDates() {
    const placed = new Date();
    const delivery = new Date(placed);
    delivery.setDate(placed.getDate() + 7);
    const format = date => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return { placed: format(placed), delivery: format(delivery) };
}

function renderOrder() {
    const listContainer = document.getElementById("order-items-list");
    const totalElement = document.getElementById("order-total");
    if (!listContainer || !totalElement) return;

    const cart = getCart();
    const shippingInfo = readStorage('shippingInfo', {});
    const paymentInfo = readStorage('paymentInfo', {});
    const shipping = cart.length > 0 ? CART_SHIPPING : 0;
    let subtotal = 0;

    listContainer.innerHTML = cart.length ? "" : '<p class="checkout-empty-note">No order items found.</p>';

    cart.forEach(item => {
        const qty = item.qty || 1;
        const price = parseFloat(item.price) || 0;
        subtotal += price * qty;
        const priceMarkup = renderLinePriceMarkup(item, qty, 'L.E ');

        const itemCard = document.createElement("div");
        itemCard.className = "order-item";
        itemCard.innerHTML = `
            <img src="${resolveAssetPath(item.image)}" alt="${item.title}">
            <div class="order-item-info">
                <h4>${item.title}</h4>
                <p>QTY: ${qty}</p>
            </div>
            <div class="order-item-price">${priceMarkup.html}</div>
        `;
        listContainer.appendChild(itemCard);
    });

    totalElement.textContent = `L.E ${(subtotal + shipping).toFixed(2)}`;

    const shippingAddress = document.getElementById('shipping-address');
    if (shippingAddress) {
        shippingAddress.innerHTML = shippingInfo.firstName ? `
            <p>${shippingInfo.firstName} ${shippingInfo.lastName}</p>
            <p>${shippingInfo.street} ${shippingInfo.number}</p>
            <p>${shippingInfo.postcode} ${shippingInfo.place}</p>
            <p>${shippingInfo.country}</p>
            <p>${shippingInfo.email}</p>
        ` : '<p>No shipping details saved.</p>';
    }

    const paymentMethod = document.getElementById('payment-method');
    if (paymentMethod) {
        paymentMethod.textContent = paymentInfo.method ? paymentInfo.method : 'Payment method not saved';
    }

    const dates = getOrderDates();
    document.querySelectorAll('[data-order-date]').forEach(el => { el.textContent = dates.placed; });
    document.querySelectorAll('[data-delivery-date]').forEach(el => { el.textContent = dates.delivery; });

    const pendingOrderId = localStorage.getItem('pendingOrderId');
    if (pendingOrderId) {
        const orderNumEl = document.querySelector('.order-card-header span');
        if (orderNumEl) orderNumEl.textContent = pendingOrderId;

        const order = {
            id: pendingOrderId,
            date: new Date().toISOString(),
            items: [...cart],
            subtotal,
            shipping,
            total: subtotal + shipping,
            shippingInfo: { ...shippingInfo },
            paymentInfo: { ...paymentInfo }
        };
        const history = readStorage('orderHistory', []);
        history.unshift(order);
        try { localStorage.setItem('orderHistory', JSON.stringify(history)); } catch(e) {}
        localStorage.removeItem('pendingOrderId');
        saveCart([]);
    }
}

function showOrderToast() {
    const toast = document.getElementById("toast");
    if (!toast) return;
    setTimeout(() => toast.classList.add("show"), 400);
}

window.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("order-items-list")) return;
    renderOrder();
    showOrderToast();
});

const STORAGE_FAVORITES_KEY = 'favorites';

function getFavorites() {
    const data = readStorage(STORAGE_FAVORITES_KEY, []);
    if (!Array.isArray(data)) return [];
    return data
        .map(item => typeof item === 'string' ? item : item?.title)
        .filter(Boolean);
}

function saveFavorites(favorites) {
    if (!Array.isArray(favorites)) return;
    const normalized = [...new Set(
        favorites
            .map(item => typeof item === 'string' ? item : item?.title)
            .filter(Boolean)
    )];
    try {
        localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(normalized));
    } catch (error) {
        // Ignore localStorage write failures.
    }
}

function isFavorite(title) {
    return getFavorites().includes(title);
}

function toggleFavorite(title) {
    if (!title) return false;
    const favorites = getFavorites();
    const index = favorites.indexOf(title);
    if (index === -1) {
        favorites.push(title);
        saveFavorites(favorites);
        return true;
    }
    favorites.splice(index, 1);
    saveFavorites(favorites);
    return false;
}

function updateFavoriteButton(button, title) {
    if (!button || !title) return;
    if (isFavorite(title)) {
        button.classList.add('active');
    } else {
        button.classList.remove('active');
    }
}

function resolveFavoriteBook(title) {
    if (!title) return null;
    if (typeof Books !== 'undefined' && Array.isArray(Books)) {
        const matched = Books.find(book => book.title === title);
        if (matched) return matched;
    }
    try {
        const cache = JSON.parse(localStorage.getItem('mktFavData') || '{}');
        if (cache[title]) return { title, ...cache[title] };
    } catch (_) {}
    return { title, author: 'Unknown author', price: '0.00', image: '', genre: '', category: '' };
}

function getFavoriteBooks() {
    return getFavorites().map(resolveFavoriteBook).filter(Boolean);
}

/* Navbar: white text over dark sections, dark text over light sections.
   Enabled on pages with data-nav-invert on <body> (home + browse). */
const NAV_DARK_SECTIONS = [
    '.nav-dark-section',
    '.book-bg',
    '.between-carouselss',
    '.about-us',
    '.site-footer',
    '.bw-card--dark',
    '.bw-card--warm-dark',
].join(', ');

function handleNavbarColorInversion() {
    const navbar = document.querySelector('.navbar');
    if (!navbar || !document.body.hasAttribute('data-nav-invert')) return;

    const navRect = navbar.getBoundingClientRect();
    const navMidY = navRect.top + navRect.height / 2;
    let isDark = false;

    document.querySelectorAll(NAV_DARK_SECTIONS).forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= navMidY && rect.bottom >= navMidY) {
            isDark = true;
        }
    });

    const ripple = document.getElementById('bgRipple');
    const isRippleActive = ripple && ripple.classList.contains('active');

    if (isDark) {
        navbar.classList.add('text-white');
    } else if (!isRippleActive) {
        navbar.classList.remove('text-white');
    }
}

window.handleNavbarColorInversion = handleNavbarColorInversion;

let navInvertTicking = false;
function scheduleNavbarColorInversion() {
    if (navInvertTicking) return;
    navInvertTicking = true;
    requestAnimationFrame(() => {
        navInvertTicking = false;
        handleNavbarColorInversion();
    });
}

window.addEventListener('scroll', scheduleNavbarColorInversion, { passive: true });
window.addEventListener('DOMContentLoaded', handleNavbarColorInversion);
window.addEventListener('load', handleNavbarColorInversion);
window.addEventListener('resize', handleNavbarColorInversion);

/*add to cart*/
/* ===== ADD TO CART / CHECKOUT JS ===== */

const CART_SHIPPING = 5;

function readStorage(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (error) {
        return fallback;
    }
}

function normalizeCart(cart) {
    const merged = [];
    (Array.isArray(cart) ? cart : []).forEach(item => {
        if (!item || !item.title) return;
        const qty = Math.max(1, parseInt(item.qty || 1, 10));
        const existing = merged.find(book => book.title === item.title);
        const incoming = (window.MKSale && window.MKSale.toCartItem)
            ? window.MKSale.toCartItem({ ...item, qty })
            : { ...item, qty };
        if (existing) {
            const currentPrice = parseFloat(existing.price) || 0;
            const incomingPrice = parseFloat(incoming.price) || 0;
            if (!currentPrice || (incomingPrice > 0 && incomingPrice < currentPrice)) {
                Object.assign(existing, incoming);
            }
            existing.qty = (existing.qty || 1) + qty;
        } else {
            merged.push(incoming);
        }
    });
    return merged;
}

function getCart() {
    const storedCart = readStorage('cart', memoryCartStore.cart);
    const normalized = normalizeCart(storedCart);
    if (JSON.stringify(storedCart) !== JSON.stringify(normalized)) {
        saveCart(normalized);
    }
    return normalized;
}

function saveCart(cart) {
    const normalized = normalizeCart(cart);
    memoryCartStore.cart = normalized;
    try {
        localStorage.setItem('cart', JSON.stringify(normalized));
    } catch (error) {
        // Keep the in-memory cart for local-file or blocked-storage previews.
    }
}

function addBookToCart(book) {
    if (!book || !book.title) return 0;
    const cart = getCart();
    const existing = cart.find(item => item.title === book.title);
    const incoming = (window.MKSale && window.MKSale.toCartItem)
        ? window.MKSale.toCartItem({ ...book, qty: 1 })
        : { ...book, qty: 1 };
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
    saveCart(cart);
    return existing ? existing.qty : 1;
}

function renderLinePriceMarkup(book, qty, prefix) {
    const quantity = Math.max(1, parseInt(qty, 10) || 1);
    if (window.MKSale && window.MKSale.getPricing) {
        const pricing = window.MKSale.getPricing(book);
        if (pricing.hasSale) {
            return {
                html: `<span class="mk-price-original" style="text-decoration:line-through;color:#8b7b73;margin-right:10px;">${prefix}${(pricing.regularPrice * quantity).toFixed(2)}</span><span class="mk-price-current" style="color:#9f3d35;font-weight:700;">${prefix}${(pricing.effectivePrice * quantity).toFixed(2)}</span>`,
                hasSale: true,
            };
        }
        return {
            html: `<span class="mk-price-current">${prefix}${(pricing.effectivePrice * quantity).toFixed(2)}</span>`,
            hasSale: false,
        };
    }
    const price = parseFloat(book && book.price) || 0;
    return { html: `<span class="mk-price-current">${prefix}${(price * quantity).toFixed(2)}</span>`, hasSale: false };
}

function resolveAssetPath(imagePath) {
    if (!imagePath) return '';
    if (/^(https?:|data:|\.\/|\.\.\/)/.test(imagePath)) return imagePath;
    return '/' + String(imagePath).replace(/^\/+/, '');
}

function updateCartSummary(subtotal) {
    const cart = getCart();
    const shipping = cart.length > 0 ? CART_SHIPPING : 0;
    const total = subtotal + shipping;
    const subEl = document.getElementById('summary-subtotal');
    const shipEl = document.getElementById('summary-shipping');
    const totalEl = document.getElementById('summary-total');
    if (subEl) subEl.textContent = `L.E ${subtotal.toFixed(2)}`;
    if (shipEl) shipEl.textContent = `L.E ${shipping.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `L.E ${total.toFixed(2)}`;

    const pageTotal = document.getElementById('cart-page-total');
    if (pageTotal) pageTotal.textContent = `L.E ${total.toFixed(2)}`;

    const countEl = document.getElementById('cart-item-count');
    if (countEl) {
        const itemCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
        countEl.textContent = `${itemCount} ${itemCount === 1 ? 'Item' : 'Items'}`;
    }
}

function changeQty(index, delta) {
    const cart = getCart();
    if (!cart[index]) return;
    cart[index].qty = Math.max(1, (cart[index].qty || 1) + delta);
    saveCart(cart);
    renderCart();
}

function removeItem(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCart();
}

function renderCart() {
    const cart = getCart();
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    const emptyMsg = document.getElementById('cart-empty-msg');
    const checkoutBtn = document.getElementById('checkout-btn');
    container.innerHTML = '';

    if (cart.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        if (checkoutBtn) checkoutBtn.disabled = true;
        updateCartSummary(0);
        return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';
    if (checkoutBtn) checkoutBtn.disabled = false;

    let subtotal = 0;
    cart.forEach((book, index) => {
        const qty = book.qty || 1;
        const price = parseFloat(book.price) || 0;
        subtotal += price * qty;
        const priceMarkup = renderLinePriceMarkup(book, qty, 'L.E ');

        const item = document.createElement('div');
        item.className = 'cart-item';
        item.innerHTML = `
            <img class="cart-item-img" src="${resolveAssetPath(book.image)}" alt="${book.title}">
            <div class="cart-item-info">
                <h3>${book.title}</h3>
                <p>${book.author || 'Maktaba Book'}</p>
            </div>
            <div class="cart-item-meta cart-item-qty-control">
                <span>Quantity</span>
                <div class="qty-row">
                    <button class="qty-btn" onclick="changeQty(${index}, -1)">-</button>
                    <span class="qty-value">${qty}</span>
                    <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                </div>
            </div>

            <div class="cart-item-price">${priceMarkup.html}</div>
            <button class="cart-remove-btn" onclick="removeItem(${index})" aria-label="Remove ${book.title}">&times;</button>
        `;
        container.appendChild(item);
    });

    updateCartSummary(subtotal);
}

document.addEventListener('DOMContentLoaded', function () {
    renderCart();

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function () {
            window.location.href = '/checkout';
        });
    }
});

function renderCheckoutItems() {
    const list = document.getElementById('checkout-items-list');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const shippingEl = document.getElementById('checkout-shipping');
    const totalEl = document.getElementById('checkout-total');
    if (!list) return;

    const cart = getCart();
    let subtotal = 0;

    if (cart.length === 0) {
        list.innerHTML = '<p class="checkout-empty-note">Your cart is empty.</p>';
    } else {
        list.innerHTML = cart.map(item => {
            const qty = item.qty || 1;
            const price = parseFloat(item.price) || 0;
            subtotal += price * qty;
            const priceMarkup = renderLinePriceMarkup(item, qty, 'L.E ');
            return `
                <div class="checkout-order-item">
                    <img class="checkout-book-cover" src="${resolveAssetPath(item.image)}" alt="${item.title}" onerror="this.style.background='#d4c4b0';this.removeAttribute('src')">
                    <div class="checkout-item-info">
                        <div class="checkout-item-title">${item.title}</div>
                        <div class="checkout-item-qty">QTY: ${qty}</div>
                    </div>
                    <div class="checkout-item-price">${priceMarkup.html}</div>
                </div>
            `;
        }).join('');
    }

    const shipping = cart.length > 0 ? CART_SHIPPING : 0;
    if (subtotalEl) subtotalEl.textContent = `L.E ${subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = `L.E ${shipping.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `L.E ${(subtotal + shipping).toFixed(2)}`;
}

function setFieldError(input, message) {
    if (!input) return;
    input.classList.toggle('is-invalid', Boolean(message));
    let error = input.parentElement.querySelector(`.field-error[data-for="${input.id}"]`);
    if (!error) {
        error = document.createElement('span');
        error.className = 'field-error';
        error.dataset.for = input.id;
        input.insertAdjacentElement('afterend', error);
    }
    error.textContent = message || '';
}

function validateShippingForm() {
    const namePattern = /^[A-Za-z][A-Za-z\s'-]{1,39}$/;
    const placePattern = /^[A-Za-z][A-Za-z\s'-]{1,49}$/;
    const digitsOnly = /^\d+$/;
    const phoneDigits = value => value.replace(/\D/g, '');
    const rules = {
        'co-fname': value => namePattern.test(value) ? '' : 'Use letters only for first name.',
        'co-lname': value => namePattern.test(value) ? '' : 'Use letters only for last name.',
        'co-email': value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Enter a valid email.',
        'co-phone': value => /^[+()\d\s-]+$/.test(value) && phoneDigits(value).length >= 7 && phoneDigits(value).length <= 15 ? '' : 'Enter a valid phone number.',
        'co-street': value => value.length >= 3 ? '' : 'Street is required.',
        'co-number': value => digitsOnly.test(value) ? '' : 'Number must be digits only.',
        'co-postcode': value => /^\d{4,10}$/.test(value) ? '' : 'Postcode must be 4-10 digits.',
        'co-place': value => placePattern.test(value) ? '' : 'Use letters only for place.',
        'co-country': value => placePattern.test(value) ? '' : 'Use letters only for country.'
    };

    let allValid = true;
    Object.entries(rules).forEach(([id, rule]) => {
        const input = document.getElementById(id);
        if (!input) return;
        const message = rule(input.value.trim());
        setFieldError(input, message);
        if (message) allValid = false;
        input.addEventListener('input', () => setFieldError(input, rule(input.value.trim())), { once: true });
    });

    return allValid;
}

function collectShippingInfo() {
    return {
        firstName: document.getElementById('co-fname').value.trim(),
        lastName: document.getElementById('co-lname').value.trim(),
        email: document.getElementById('co-email').value.trim(),
        phone: document.getElementById('co-phone').value.trim(),
        street: document.getElementById('co-street').value.trim(),
        number: document.getElementById('co-number').value.trim(),
        postcode: document.getElementById('co-postcode').value.trim(),
        place: document.getElementById('co-place').value.trim(),
        country: document.getElementById('co-country').value.trim()
    };
}

document.addEventListener('DOMContentLoaded', function () {
    renderCheckoutItems();

    const submitBtn = document.getElementById('checkoutSubmitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async function () {
            if (getCart().length === 0) return;
            if (!validateShippingForm()) return;
            const info = collectShippingInfo();
            localStorage.setItem('shippingInfo', JSON.stringify(info));

            // Optionally save shipping address back to the user account
            const saveChk = document.getElementById('save-addr-checkbox');
            const tok = localStorage.getItem('maktabaToken');
            if (saveChk && saveChk.checked && tok) {
                try {
                    const mkBase = location.port === '3000' ? '' : 'http://localhost:3000';
                    await fetch(mkBase + '/api/auth/profile', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tok },
                        body: JSON.stringify({
                            address: {
                                fullName: (info.firstName + ' ' + info.lastName).trim(),
                                street:   info.street + (info.number ? ' ' + info.number : ''),
                                city:     info.place,
                                phone:    info.phone
                            }
                        })
                    });
                } catch(_) {}
            }
            window.location.href = '/payment';
        });

        const tok = localStorage.getItem('maktabaToken');
        if (tok) {
            const mkBase = location.port === '3000' ? '' : 'http://localhost:3000';
            // Show "Save to account" checkbox for signed-in users
            const saveWrap = document.getElementById('save-addr-wrap');
            if (saveWrap) saveWrap.style.display = '';

            fetch(mkBase + '/api/auth/me', { headers: { 'Authorization': 'Bearer ' + tok } })
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                    const user = data && data.user;
                    const banner = document.getElementById('saved-addr-banner');
                    if (!banner || !user) return;
                    const addr = user.address || {};
                    const hasData = addr.fullName || addr.street || user.email;
                    if (!hasData) return;
                    const label = [addr.fullName || user.name, addr.street, addr.city].filter(Boolean).join(' · ');
                    banner.querySelector('.saved-info-text').textContent = label;
                    banner.style.display = 'flex';
                    banner.querySelector('.use-saved-btn').onclick = function () {
                        const parts = (addr.fullName || user.name || '').trim().split(' ');
                        const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
                        set('co-fname', parts[0]);
                        set('co-lname', parts.slice(1).join(' '));
                        set('co-email', user.email || '');
                        set('co-phone', addr.phone || '');
                        set('co-street', addr.street || '');
                        set('co-number', '');
                        set('co-postcode', '');
                        set('co-place', addr.city || '');
                        set('co-country', '');
                        banner.style.display = 'none';
                        if (typeof window.mkToast === 'function') window.mkToast('Saved address applied.');
                    };
                }).catch(() => {});
        }
    }

    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        setupPaymentForm(paymentForm);
    }
});

function setupPaymentForm(paymentForm) {
    const methodCards = document.querySelectorAll('.payment-method-card');
    const cardFields = document.getElementById('card-payment-fields');

    const updateMethod = () => {
        const selected = paymentForm.querySelector('input[name="paymentMethod"]:checked');
        const groupError = document.getElementById('payment-method-error');
        methodCards.forEach(card => card.classList.toggle('selected', card.querySelector('input') === selected));
        if (cardFields) cardFields.hidden = !selected || selected.value !== 'Card';
        if (groupError && selected) groupError.textContent = '';
    };

    paymentForm.querySelectorAll('input[name="paymentMethod"]').forEach(input => {
        input.addEventListener('change', updateMethod);
    });
    updateMethod();

    // Auto-fill saved payment + show "Save to account" for logged-in users
    const tok = localStorage.getItem('maktabaToken');
    if (tok) {
        const savePayWrap = document.getElementById('save-pay-wrap');
        if (savePayWrap) savePayWrap.style.display = '';

        const mkBase = location.port === '3000' ? '' : 'http://localhost:3000';
        fetch(mkBase + '/api/auth/me', { headers: { 'Authorization': 'Bearer ' + tok } })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                const user = data && data.user;
                const banner = document.getElementById('saved-pay-banner');
                if (!banner || !user) return;
                const pay = user.payment || {};
                if (!pay.last4) return;
                const label = 'Card ending in ' + pay.last4 + (pay.expiry ? ' · exp ' + pay.expiry : '');
                banner.querySelector('.saved-info-text').textContent = label;
                banner.style.display = 'flex';
                banner.querySelector('.use-saved-btn').onclick = function () {
                    const cardRadio = paymentForm.querySelector('input[value="Card"]');
                    if (cardRadio) { cardRadio.checked = true; updateMethod(); }
                    const set = (id, v) => { const el = document.getElementById(id); if (el && v) el.value = v; };
                    set('card-name', pay.cardName || '');
                    const numEl = document.getElementById('card-number');
                    if (numEl) { numEl.value = '•••• •••• •••• ' + pay.last4; numEl.dataset.savedCard = 'true'; }
                    if (pay.expiry) {
                        const parts = pay.expiry.split(/[\s/]+/);
                        const mEl = document.getElementById('card-month');
                        const yEl = document.getElementById('card-year');
                        if (mEl && parts[0]) mEl.value = parts[0].padStart(2, '0');
                        if (yEl && parts[1]) yEl.value = parts[1].length === 2 ? '20' + parts[1] : parts[1];
                    }
                    banner.style.display = 'none';
                    if (typeof window.mkToast === 'function') window.mkToast('Saved payment applied.');
                };
            }).catch(() => {});
    }

    paymentForm.addEventListener('submit', async event => {
        event.preventDefault();
        const methodInput = paymentForm.querySelector('input[name="paymentMethod"]:checked');
        let valid = true;

        if (!methodInput) {
            const groupError = document.getElementById('payment-method-error');
            if (groupError) groupError.textContent = 'Choose a payment method.';
            valid = false;
        }

        if (methodInput && methodInput.value === 'Card') {
            const numEl = document.getElementById('card-number');
            const usingSaved = numEl && numEl.dataset.savedCard === 'true';
            const cardRules = {
                'card-name':   value => value ? '' : 'Name on card is required.',
                'card-number': value => usingSaved || /^\d{13,19}$/.test(value.replace(/[\s•]/g, '')) ? '' : 'Enter a valid card number.',
                'card-month':  value => value ? '' : 'Choose an expiry month.',
                'card-year':   value => value ? '' : 'Choose an expiry year.',
                'card-cvc':    value => usingSaved || /^\d{3,4}$/.test(value) ? '' : 'Enter a valid CVC.'
            };
            Object.entries(cardRules).forEach(([id, rule]) => {
                const input = document.getElementById(id);
                if (!input) return;
                const message = rule(input.value.trim());
                setFieldError(input, message);
                if (message) valid = false;
            });
        }

        if (!valid) return;

        const placeBtn = paymentForm.querySelector('[type="submit"]');
        if (placeBtn) { placeBtn.disabled = true; placeBtn.textContent = 'Placing order…'; }

        const shippingInfo = readStorage('shippingInfo', {});
        const cart = getCart();
        let subtotal = 0;
        cart.forEach(item => { subtotal += (parseFloat(item.price) || 0) * (item.qty || 1); });
        const shipping = cart.length > 0 ? CART_SHIPPING : 0;

        const orderPayload = {
            customerInfo: {
                firstName: shippingInfo.firstName || '',
                lastName:  shippingInfo.lastName  || '',
                email:     shippingInfo.email     || localStorage.getItem('maktabaUserEmail') || '',
                phone:     shippingInfo.phone     || ''
            },
            items: cart.map(item => ({
                title:    item.title  || '',
                author:   item.author || '',
                price:    parseFloat(item.price) || 0,
                quantity: item.qty || 1,
                image:    item.image || '',
                originalPrice: parseFloat(item.originalPrice ?? item.price) || 0,
                salePrice:     parseFloat(item.salePrice ?? item.price) || 0,
                salePercent:   Number(item.salePercent || 0),
                isOnSale:      Boolean(item.isOnSale || ((parseFloat(item.salePrice ?? item.price) || 0) > 0 && (parseFloat(item.originalPrice ?? item.price) || 0) > (parseFloat(item.salePrice ?? item.price) || 0)))
            })),
            shippingAddress: {
                street:   shippingInfo.street   || '',
                number:   shippingInfo.number   || '',
                postcode: shippingInfo.postcode || '',
                place:    shippingInfo.place    || '',
                country:  shippingInfo.country  || ''
            },
            paymentInfo:  { method: methodInput.value, status: 'pending' },
            orderSummary: { subtotal, shipping, total: subtotal + shipping }
        };

        let orderId = 'MKTBA-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        try {
            const mkBase = location.port === '3000' ? '' : 'http://localhost:3000';
            const hdrs = { 'Content-Type': 'application/json' };
            const t = localStorage.getItem('maktabaToken');
            if (t) hdrs['Authorization'] = 'Bearer ' + t;
            const res = await fetch(mkBase + '/api/orders', {
                method: 'POST', headers: hdrs, body: JSON.stringify(orderPayload)
            });
            const result = await res.json();
            if (result.orderNumber) orderId = result.orderNumber;
        } catch (e) { /* fall through with generated id */ }

        localStorage.setItem('paymentInfo', JSON.stringify({ method: methodInput.value }));
        localStorage.setItem('pendingOrderId', orderId);

        // Optionally save payment details back to the user account
        const savePayChk = document.getElementById('save-pay-checkbox');
        if (savePayChk && savePayChk.checked && tok) {
            try {
                const mkBase2 = location.port === '3000' ? '' : 'http://localhost:3000';
                const cardName = (document.getElementById('card-name') || {}).value || '';
                const cardNum  = (document.getElementById('card-number') || {}).value || '';
                const month    = (document.getElementById('card-month') || {}).value || '';
                const year     = (document.getElementById('card-year') || {}).value || '';
                await fetch(mkBase2 + '/api/auth/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tok },
                    body: JSON.stringify({
                        payment: {
                            method:     methodInput.value,
                            cardName:   cardName,
                            cardNumber: cardNum.replace(/\D/g, '').slice(-4),
                            expiry:     month && year ? month + '/' + year : ''
                        }
                    })
                });
            } catch(_) {}
        }

        window.location.href = '/order-success';
    });
}

/* THE FOOTER LINKS */


const footerLinks = document.querySelectorAll('.footer-link');

footerLinks.forEach(link => {
    const targetId = link.getAttribute('data-target');
    if (!targetId) return; // only intercept footer links meant to scroll within the current page

    link.addEventListener('click', function (e) {
        const targetSection = document.getElementById(targetId);
        if (!targetSection) return; // allow normal navigation if the section does not exist

        e.preventDefault();

        // Get the position and scroll smoothly
        const offset = 80; // Space for your header/top padding
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = targetSection.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    });
});

/* Active page indicator - highlights current page link in navbar */
(function setActiveNavLink() {
    function trySet() {
        const navLinks = document.querySelectorAll('.navbar ul li a');
        if (!navLinks.length) return false;

        const currentPage = window.location.pathname.split('/').pop().toLowerCase();

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#')) return;

            const linkPage = href.split('/').pop().toLowerCase();
            const isHome = currentPage === '' || currentPage === 'home' || currentPage === 'home.html';

            if (linkPage === currentPage || (isHome && (linkPage === 'home' || linkPage === 'home.html'))) {
                link.classList.add('active-link');
            }
        });
        return true;
    }

    if (!trySet()) {
        document.addEventListener('DOMContentLoaded', trySet);
    }
})();



// Newsletter Form Submission
document.addEventListener('DOMContentLoaded', () => {
    const newsletterForm = document.getElementById('newsletterForm');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('newsletterEmail');
            const email = emailInput.value.trim();
            
            if (email) {
                // Show success message
                const btn = newsletterForm.querySelector('.newsletter-btn');
                const originalText = btn.textContent;
                
                btn.textContent = 'Subscribed!';
                btn.style.backgroundColor = '#4CAF50';
                btn.style.color = '#ffffff';
                
                // Reset form
                emailInput.value = '';
                
                // Reset button after 3 seconds
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.backgroundColor = '';
                    btn.style.color = '';
                }, 3000);
                
                // Here you would typically send the email to your backend
                console.log('Newsletter subscription:', email);
            }
        });
    }
});


/* ===================================================================
   MAKTABA SESSION MODULE
   - Navbar auth toggle (Sign In  <->  Log Out)
   - Bottom-right dark confirmation toast (primary theme color)
   - Logout
   - Cart + Favorites <-> User collection sync (when logged in)
   =================================================================== */
(function () {
  "use strict";
  var BASE = (location.port === "3000") ? "" : "http://localhost:3000";
  function token()   { return localStorage.getItem("maktabaToken") || ""; }
  function authed()  { return !!token(); }
  function jsonHdr() { var h = { "Content-Type": "application/json" }; if (authed()) h["Authorization"] = "Bearer " + token(); return h; }
  function getHdr()  { return authed() ? { "Authorization": "Bearer " + token() } : {}; }

  /* ---- Confirmation toast: dark (primary), bottom-right ---- */
  function mkToast(msg, opts) {
    opts = opts || {};
    var old = document.getElementById("mk-session-toast"); if (old) old.remove();
    var t = document.createElement("div");
    t.id = "mk-session-toast";
    t.textContent = msg;
    t.style.cssText =
      "position:fixed;bottom:28px;right:28px;z-index:2147483647;" +
      "background:#312F2C;color:#F0EDE5;padding:14px 20px;border-radius:12px;" +
      "font:500 14px/1.45 Jost,system-ui,Segoe UI,sans-serif;letter-spacing:.01em;" +
      "box-shadow:0 16px 40px -12px rgba(0,0,0,.5);max-width:340px;" +
      "transform:translateY(16px);opacity:0;transition:transform .45s cubic-bezier(.16,1,.3,1),opacity .45s;pointer-events:none;";
    document.body.appendChild(t);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ t.style.transform="translateY(0)"; t.style.opacity="1"; }); });
    setTimeout(function(){ t.style.transform="translateY(16px)"; t.style.opacity="0"; setTimeout(function(){ if(t.parentNode) t.remove(); }, 480); }, opts.duration || 3200);
  }
  window.mkToast = mkToast;

  /* Show a toast handed off from a previous page (e.g. after login redirect) */
  try {
    var pend = sessionStorage.getItem("mkFlashToast");
    if (pend) { sessionStorage.removeItem("mkFlashToast"); setTimeout(function(){ mkToast(pend); }, 400); }
  } catch (e) {}

  /* ---- Logout ---- */
  function mkLogout() {
    try { fetch(BASE + "/api/auth/logout", { method: "POST", headers: getHdr() }).catch(function(){}); } catch (e) {}
    ["maktabaToken","maktabaUserName","maktabaUserEmail","maktabaUserRole","maktabaLoggedInUser"].forEach(function(k){ localStorage.removeItem(k); });
    try { localStorage.removeItem("cart"); localStorage.removeItem("favorites"); } catch(e) {}
    try { sessionStorage.setItem("mkFlashToast", "You have been logged out."); } catch (e) {}
    location.href = "/home";
  }
  window.mkLogout = mkLogout;

  /* ---- Navbar: Sign In when logged out, Log Out when logged in ---- */
  function paintNav() {
    var dd = document.querySelector(".menu-dropdown");
    if (!dd) return;
    var signinHref = "/signin";

    // ── Admin dashboard shortcut (only for role === 'admin') ──────────
    var dashLink = dd.querySelector("#mkDashLink");
    var role = localStorage.getItem("maktabaUserRole");
    if (authed() && role === "admin") {
      if (!dashLink) {
        dashLink = document.createElement("a");
        dashLink.id = "mkDashLink";
        dashLink.href = "/dashboard";
        dashLink.textContent = "Dashboard";
        // Insert before the auth link so it always appears above Sign In / Log Out
        dd.insertBefore(dashLink, dd.firstChild);
      }
    } else {
      if (dashLink) dashLink.remove();
    }

    // ── Auth link ─────────────────────────────────────────────────────
    var link = dd.querySelector("#mkAuthLink");
    if (!link) { link = document.createElement("a"); link.id = "mkAuthLink"; dd.appendChild(link); }
    if (authed()) {
      link.textContent = "Log Out";
      link.href = "#";
      link.onclick = function (e) { e.preventDefault(); mkLogout(); };
    } else {
      link.textContent = "Sign In";
      link.href = signinHref;
      link.onclick = null;
    }

    // ── Mobile menu auth button ───────────────────────────────────────
    var mobAuth = document.getElementById("mkMobAuthBtn");
    if (mobAuth) {
      if (authed()) {
        mobAuth.textContent = "Log Out";
        mobAuth.href = "#";
        mobAuth.onclick = function (e) { e.preventDefault(); mkLogout(); };
      } else {
        mobAuth.textContent = "Sign In";
        mobAuth.href = signinHref;
        mobAuth.onclick = null;
      }
    }
  }
  window.mkPaintNav = paintNav;

  /* ---- Favorites + Cart DB sync ---- */
  function pushFavorites() {
    if (!authed()) return;
    var fav; try { fav = JSON.parse(localStorage.getItem("favorites") || "[]"); } catch (e) { fav = []; }
    fav = fav.map(function(x){ return typeof x === "string" ? x : (x && x.title); }).filter(Boolean);
    fetch(BASE + "/api/auth/favorites", { method:"PUT", headers: jsonHdr(), body: JSON.stringify({ favorites: fav }) }).catch(function(){});
  }
  function pushCart() {
    if (!authed()) return;
    var cart; try { cart = JSON.parse(localStorage.getItem("cart") || "[]"); } catch (e) { cart = []; }
    fetch(BASE + "/api/auth/cart", { method:"PUT", headers: jsonHdr(), body: JSON.stringify({ cart: cart }) }).catch(function(){});
  }
  window.mkPushFavorites = pushFavorites;
  window.mkPushCart = pushCart;

  /* Wrap the global save functions (defined above in this file) so every
     change also persists to the User document when logged in. */
  // Persist to the User document whenever the cart / favorites change in
  // localStorage — reliably catches every write path (add, remove, qty, clear).
  /* ---- Cart badge: red item-count dot above the cart icon ---- */
  function updateCartBadge() {
    var cartLinks = document.querySelectorAll('.navbar-icons a');
    var cart; try { cart = JSON.parse(localStorage.getItem("cart") || "[]"); } catch(e) { cart = []; }
    var count = 0;
    cart.forEach(function(i) { count += Math.max(1, parseInt(i.qty || 1, 10)); });
    cartLinks.forEach(function(link) {
      var icon = link.querySelector('.material-symbols-outlined');
      if (!icon || icon.textContent.trim() !== 'shopping_bag') return;
      var badge = link.querySelector('.mk-cart-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'mk-cart-badge';
        badge.style.cssText = 'position:absolute;top:-7px;right:-7px;background:#c0392b;color:#fff;' +
          'border-radius:50%;min-width:18px;height:18px;padding:0 3px;box-sizing:border-box;' +
          'font:700 10px/18px Jost,system-ui,sans-serif;text-align:center;pointer-events:none;';
        link.style.position = 'relative';
        link.appendChild(badge);
      }
      badge.textContent = count > 99 ? '99+' : String(count);
      badge.style.display = count > 0 ? 'block' : 'none';
    });
  }
  window.mkUpdateCartBadge = updateCartBadge;

  var _origSet = localStorage.setItem.bind(localStorage);
  var _pushTimers = {};
  function _debounce(key, fn) { clearTimeout(_pushTimers[key]); _pushTimers[key] = setTimeout(fn, 250); }
  localStorage.setItem = function (k, v) {
    _origSet(k, v);
    if (k === "cart") updateCartBadge();
    if (!authed()) return;
    if (k === "cart") _debounce("cart", pushCart);
    else if (k === "favorites") _debounce("fav", pushFavorites);
  };

  /* Called by auth.js right after a successful login: merge DB <-> local,
     then persist the union so nothing is lost across devices. */
  window.mkSyncOnLogin = function () {
    if (!authed()) return Promise.resolve();
    return Promise.all([
      fetch(BASE + "/api/auth/favorites", { headers: getHdr() }).then(function(r){ return r.ok ? r.json() : {favorites:[]}; }).catch(function(){ return {favorites:[]}; }),
      fetch(BASE + "/api/auth/cart",      { headers: getHdr() }).then(function(r){ return r.ok ? r.json() : {cart:[]}; }).catch(function(){ return {cart:[]}; })
    ]).then(function (res) {
      var dbFav = (res[0] && res[0].favorites) || [];
      var dbCart = (res[1] && res[1].cart) || [];
      var locFav; try { locFav = JSON.parse(localStorage.getItem("favorites") || "[]"); } catch (e) { locFav = []; }
      locFav = locFav.map(function(x){ return typeof x==="string"?x:(x&&x.title); }).filter(Boolean);
      var mergedFav = Array.prototype.slice.call(new Set(dbFav.concat(locFav)));
      var locCart; try { locCart = JSON.parse(localStorage.getItem("cart") || "[]"); } catch (e) { locCart = []; }
      // Cart: prefer DB if it has items, else keep the local cart.
      var mergedCart = (dbCart && dbCart.length) ? dbCart : locCart;
      localStorage.setItem("favorites", JSON.stringify(mergedFav));
      localStorage.setItem("cart", JSON.stringify(mergedCart));
      pushFavorites(); pushCart();
    }).catch(function(){});
  };

  /* Paint the navbar + badge as soon as the DOM is ready (and now, if already ready). */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() { paintNav(); updateCartBadge(); });
  } else {
    paintNav();
    updateCartBadge();
  }
})();
