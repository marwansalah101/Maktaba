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

        const itemCard = document.createElement("div");
        itemCard.className = "order-item";
        itemCard.innerHTML = `
            <img src="${resolveAssetPath(item.image)}" alt="${item.title}">
            <div class="order-item-info">
                <h4>${item.title}</h4>
                <p>QTY: ${qty}</p>
            </div>
            <div class="order-item-price">&euro;${(price * qty).toFixed(2)}</div>
        `;
        listContainer.appendChild(itemCard);
    });

    totalElement.textContent = `\u20AC${(subtotal + shipping).toFixed(2)}`;

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

function showToast() {
    const toast = document.getElementById("toast");
    if (!toast) return;
    setTimeout(() => {
        toast.classList.add("show");
    }, 400);
}

window.addEventListener("DOMContentLoaded", () => {
    renderOrder();
    showToast();
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
    return { title, author: 'Unknown author', price: '0.00', image: '', genre: '', category: '' };
}

function getFavoriteBooks() {
    return getFavorites().map(resolveFavoriteBook).filter(Boolean);
}

/* Make navbar items white over dark backgrounds globally */
/* Dark sections that trigger white navbar: .book-bg (hero), .between-carouselss (ticker), .about-us, .site-footer */
function handleNavbarColorInversion() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const darkSections = document.querySelectorAll('.book-bg, .between-carouselss, .about-us, .site-footer');
    const navRect = navbar.getBoundingClientRect();

    let isDark = false;

    darkSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top < navRect.bottom - 10 && rect.bottom > navRect.top + 10) {
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

window.addEventListener('scroll', handleNavbarColorInversion);
window.addEventListener('DOMContentLoaded', handleNavbarColorInversion);
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
        if (existing) {
            existing.qty = (existing.qty || 1) + qty;
        } else {
            merged.push({ ...item, qty });
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
    if (existing) {
        existing.qty = (existing.qty || 1) + 1;
    } else {
        cart.push({ ...book, qty: 1 });
    }
    saveCart(cart);
    return existing ? existing.qty : 1;
}

function resolveAssetPath(imagePath) {
    if (!imagePath) return '';
    if (/^(https?:|data:|\.\/|\.\.\/)/.test(imagePath)) return imagePath;
    const basePath = window.location.pathname.includes('/pages/') ? '../../' : './';
    return basePath + imagePath;
}

function updateCartSummary(subtotal) {
    const cart = getCart();
    const shipping = cart.length > 0 ? CART_SHIPPING : 0;
    const total = subtotal + shipping;
    const subEl = document.getElementById('summary-subtotal');
    const shipEl = document.getElementById('summary-shipping');
    const totalEl = document.getElementById('summary-total');
    if (subEl) subEl.textContent = `\u20AC${subtotal.toFixed(2)}`;
    if (shipEl) shipEl.textContent = `\u20AC${shipping.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `\u20AC${total.toFixed(2)}`;

    const pageTotal = document.getElementById('cart-page-total');
    if (pageTotal) pageTotal.textContent = `\u20AC${total.toFixed(2)}`;

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

        const item = document.createElement('div');
        item.className = 'cart-item';
        item.innerHTML = `
            <img class="cart-item-img" src="${resolveAssetPath(book.image)}" alt="${book.title}">
            <div class="cart-item-info">
                <h3>${book.title}</h3>
                <p>${book.author || 'Maktaba Book'}</p>
                <span>Short description of book selected from your library</span>
            </div>
            <div class="cart-item-meta cart-item-qty-control">
                <span>Quantity</span>
                <div class="qty-row">
                    <button class="qty-btn" onclick="changeQty(${index}, -1)">-</button>
                    <span class="qty-value">${qty}</span>
                    <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                </div>
            </div>

            <div class="cart-item-price">&euro;${(price * qty).toFixed(2)}</div>
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
            window.location.href = './checkout.html';
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
            return `
                <div class="checkout-order-item">
                    <img class="checkout-book-cover" src="${resolveAssetPath(item.image)}" alt="${item.title}" onerror="this.style.background='#d4c4b0';this.removeAttribute('src')">
                    <div class="checkout-item-info">
                        <div class="checkout-item-title">${item.title}</div>
                        <div class="checkout-item-qty">QTY: ${qty}</div>
                    </div>
                    <div class="checkout-item-price">&euro;${(price * qty).toFixed(2)}</div>
                </div>
            `;
        }).join('');
    }

    const shipping = cart.length > 0 ? CART_SHIPPING : 0;
    if (subtotalEl) subtotalEl.textContent = `\u20AC${subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = `\u20AC${shipping.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `\u20AC${(subtotal + shipping).toFixed(2)}`;
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
        submitBtn.addEventListener('click', function () {
            if (getCart().length === 0) return;
            if (!validateShippingForm()) return;
            localStorage.setItem('shippingInfo', JSON.stringify(collectShippingInfo()));
            window.location.href = './payment.html';
        });
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

    paymentForm.addEventListener('submit', event => {
        event.preventDefault();
        const methodInput = paymentForm.querySelector('input[name="paymentMethod"]:checked');
        let valid = true;

        if (!methodInput) {
            const groupError = document.getElementById('payment-method-error');
            if (groupError) groupError.textContent = 'Choose a payment method.';
            valid = false;
        }

        if (methodInput && methodInput.value === 'Card') {
            const cardRules = {
                'card-name': value => value ? '' : 'Name on card is required.',
                'card-number': value => /^\d{13,19}$/.test(value.replace(/\s/g, '')) ? '' : 'Enter a valid card number.',
                'card-month': value => value ? '' : 'Choose an expiry month.',
                'card-year': value => value ? '' : 'Choose an expiry year.',
                'card-cvc': value => /^\d{3,4}$/.test(value) ? '' : 'Enter a valid CVC.'
            };
            Object.entries(cardRules).forEach(([id, rule]) => {
                const input = document.getElementById(id);
                const message = rule(input.value.trim());
                setFieldError(input, message);
                if (message) valid = false;
            });
        }

        if (!valid) return;

        const orderId = '#MKTBA-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        localStorage.setItem('paymentInfo', JSON.stringify({ method: methodInput.value }));
        localStorage.setItem('pendingOrderId', orderId);
        window.location.href = './order-success.html';
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
            const isHome = currentPage === '' || currentPage === 'home.html';

            if (linkPage === currentPage || (isHome && linkPage === 'home.html')) {
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
