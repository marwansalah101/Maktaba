// Checkout behavior is handled by ../../script.js to avoid duplicate global checkout code.



const CART_SHIPPING = 60;

function formatMoney(amount, prefix) {
    const value = parseFloat(String(amount).replace(/[^0-9.-]/g, ''));
    return `${prefix}${(Number.isFinite(value) ? value : 0).toFixed(2)}`;
}

function getPriceMarkup(book, prefix, qty) {
    const quantity = Math.max(1, parseInt(qty, 10) || 1);
    if (window.MKSale && window.MKSale.getPricing) {
        const pricing = window.MKSale.getPricing(book);
        if (pricing.hasSale) {
            return {
                html: `<span class="mk-price-original" style="text-decoration:line-through;color:#8b7b73;margin-right:10px;">${formatMoney(pricing.regularPrice * quantity, prefix)}</span><span class="mk-price-current" style="color:#9f3d35;font-weight:700;">${formatMoney(pricing.effectivePrice * quantity, prefix)}</span>`,
                hasSale: true
            };
        }
        return {
            html: `<span class="mk-price-current">${formatMoney(pricing.effectivePrice * quantity, prefix)}</span>`,
            hasSale: false
        };
    }
    const price = parseFloat(String(book.price).replace(/[^0-9.-]/g, '')) || 0;
    return { html: `<span class="mk-price-current">${formatMoney(price * quantity, prefix)}</span>`, hasSale: false };
}

function resolveAssetPath(imagePath) {
    if (!imagePath) return '';
    if (/^(https?:|data:|\.\/|\.\.\/)/.test(imagePath)) return imagePath;
    return '/' + String(imagePath).replace(/^\/+/, '');
}

function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartSummary(subtotal) {
    const cart = getCart();
    const shipping = cart.length > 0 ? CART_SHIPPING : 0;
    const subEl = document.getElementById('summary-subtotal');
    const shipEl = document.getElementById('summary-shipping');
    const totalEl = document.getElementById('summary-total');
    const pageTotal = document.getElementById('cart-page-total');
    const countEl = document.getElementById('cart-item-count');

    const itemCount = cart.reduce((sum, item) => sum + (parseInt(item.qty, 10) || 1), 0);
    if (countEl) {
        countEl.textContent = `${itemCount} ${itemCount === 1 ? 'Item' : 'Items'}`;
    }

    if (subEl) subEl.textContent = `L.E ${subtotal.toFixed(2)}`;
    if (shipEl) shipEl.textContent = `L.E ${shipping.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `L.E ${(subtotal + shipping).toFixed(2)}`;
    if (pageTotal) pageTotal.textContent = `L.E ${subtotal.toFixed(2)}`;
}

function changeQty(index, delta) {
    const cart = getCart();
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
        const qty = Math.max(1, parseInt(book.qty, 10) || 1);
        const price = parseFloat(String(book.price).replace(/[^0-9.-]/g, '')) || 0;
        subtotal += price * qty;
        const priceMarkup = getPriceMarkup(book, 'L.E ', qty);

        const item = document.createElement('div');
        item.className = 'cart-item';
        item.innerHTML = `
            <img class="cart-item-img" src="${resolveAssetPath(book.image)}" alt="${book.title}">
            <div class="cart-item-info">
                <h3>${book.title}</h3>
                <p>${book.author}</p>
                <div class="qty-row">
                    <button class="qty-btn" onclick="changeQty(${index}, -1)">−</button>
                    <span class="qty-value">${qty}</span>
                    <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                </div>
            </div>
            <div class="cart-item-meta cart-item-qty-control"></div>
            <div class="cart-item-price">${priceMarkup.html}</div>
            <button class="cart-remove-btn" onclick="removeItem(${index})">✕</button>
        `;
        container.appendChild(item);
    });

    updateCartSummary(subtotal);
}

// Go to checkout
document.addEventListener('DOMContentLoaded', function () {
    renderCart();
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function () {
            window.location.href = '/checkout';
        });
    }
});
/*checkout*/ 
/* ===== CHECKOUT PAGE JS ===== */

document.addEventListener('DOMContentLoaded', function () {

    // Render cart items in summary
    function renderCheckoutItems() {
        const list = document.getElementById('checkout-items-list');
        const subtotalEl = document.getElementById('checkout-subtotal');
        const shippingEl = document.getElementById('checkout-shipping');
        const totalEl = document.getElementById('checkout-total');

        if (!list) return;

        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        let subtotal = 0;

        if (cart.length === 0) {
            list.innerHTML = '<p style="color:#aaa;font-size:13px;padding:10px 0;">Your cart is empty.</p>';
        } else {
            list.innerHTML = cart.map(item => {
                const qty = item.qty || 1;
                const price = parseFloat(item.price);
                subtotal += price * qty;
                const priceMarkup = getPriceMarkup(item, 'L.E ', qty);
                return `
                    <div class="checkout-order-item">
                        <img class="checkout-book-cover"
                             src="${resolveAssetPath(item.image)}"
                             alt="${item.title}"
                             onerror="this.style.background='#d4c4b0';this.removeAttribute('src')">
                        <div class="checkout-item-info">
                            <div class="checkout-item-title">${item.title}</div>
                            <div class="checkout-item-qty">QTY: ${qty}</div>
                        </div>
                        <div class="checkout-item-price">${priceMarkup.html}</div>
                    </div>
                `;
            }).join('');
        }

        const shipping = cart.length > 0 ? 5 : 0;
        if (subtotalEl) subtotalEl.textContent = `L.E ${subtotal.toFixed(2)}`;
        if (shippingEl) shippingEl.textContent = `L.E ${shipping.toFixed(2)}`;
        if (totalEl)    totalEl.textContent    = `L.E ${(subtotal + shipping).toFixed(2)}`;
    }

    renderCheckoutItems();

    // Submit
    const submitBtn = document.getElementById('checkoutSubmitBtn');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', function () {
        const fields = [
            'co-fname', 'co-lname', 'co-email',
            'co-street', 'co-number',
            'co-postcode', 'co-place', 'co-country'
        ];

        let allValid = true;

        fields.forEach(id => {
            const input = document.getElementById(id);
            if (!input) return;
            if (!input.value.trim()) {
                input.style.borderColor = '#c0392b';
                allValid = false;
            } else {
                input.style.borderColor = '';
            }
            input.addEventListener('input', () => input.style.borderColor = '', { once: true });
        });

        if (!allValid) return;

        localStorage.setItem('shippingInfo', JSON.stringify({
            firstName: document.getElementById('co-fname').value,
            lastName:  document.getElementById('co-lname').value,
            email:     document.getElementById('co-email').value,
            street:    document.getElementById('co-street').value,
            number:    document.getElementById('co-number').value,
            postcode:  document.getElementById('co-postcode').value,
            place:     document.getElementById('co-place').value,
            country:   document.getElementById('co-country').value
        }));

        window.location.href = '/order-success';
    });
});

