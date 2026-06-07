    // ─────────────────────────────────────────────────────────────────────────────
//  account.js  —  Maktaba  |  Settings Page
// ─────────────────────────────────────────────────────────────────────────────

function getEmail() {
    // ✅ FIX: added maktabaUserEmail as primary key (set at login)
    return localStorage.getItem("maktabaUserEmail")
        || localStorage.getItem("userEmail")
        || localStorage.getItem("email")
        || "";
}

function authHeaders() {
    return { "Content-Type": "application/json", "x-user-email": getEmail() };
}

/* ── TAB SWITCHING ───────────────────────────────────────────────────────── */
function showTab(name, btn) {
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    document.getElementById("tab-" + name).classList.add("active");
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    if (name === "orders")  loadOrderHistory();
    if (name === "address") loadSavedAddress();
    if (name === "payment") loadSavedPayment();
    if (name === "account") loadAccountSettings(); // ✅ FIX: load account data when tab opens
}

/* ── TOAST ───────────────────────────────────────────────────────────────── */
function showToast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg || "Saved";
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2200);
}

/* ── AVATAR ──────────────────────────────────────────────────────────────── */
function previewAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        document.getElementById("avatarEl").innerHTML = `<img src="${ev.target.result}">`;
    };
    reader.readAsDataURL(file);
}

function removeAvatar() {
    document.getElementById("avatarEl").innerHTML = "WA";
}

/* ── ACCOUNT SETTINGS — load / save ─────────────────────────────────────── */

// ✅ NEW: load name + email from backend into the form fields
async function loadAccountSettings() {
    const email = getEmail();
    if (!email) return;

    try {
        const res  = await fetch("/api/auth/profile", { headers: authHeaders() });
        if (!res.ok) return;
        const data = await res.json();

        const nameEl  = document.getElementById("acc-name");
        const emailEl = document.getElementById("acc-email");

        if (nameEl  && data.name)  nameEl.value  = data.name;
        if (emailEl && data.email) emailEl.value = data.email;
    } catch (err) {
        console.error("Could not load account settings:", err);
    }
}

// ✅ NEW: send updated name / email / password to backend
async function saveAccountSettings() {
    const nameEl     = document.getElementById("acc-name");
    const emailEl    = document.getElementById("acc-email");
    const passwordEl = document.getElementById("acc-password");

    const payload = {};
    if (nameEl?.value.trim())     payload.name     = nameEl.value.trim();
    if (emailEl?.value.trim())    payload.email    = emailEl.value.trim();
    if (passwordEl?.value.trim()) payload.password = passwordEl.value.trim();

    if (Object.keys(payload).length === 0) {
        showToast("Nothing to save.");
        return;
    }

    try {
        const res  = await fetch("/api/auth/update", {
            method:  "PUT",
            headers: authHeaders(),
            body:    JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showToast(err.message || "Could not save. Please try again.");
            return;
        }

        const data = await res.json();

        // ✅ Keep localStorage in sync with the new email if it changed
        if (data.email) {
            localStorage.setItem("maktabaUserEmail", data.email);
            localStorage.setItem("userEmail",        data.email);
        }

        // ✅ Update avatar initials if name changed
        if (data.name) {
            const initials = data.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            const avatarEl = document.getElementById("avatarEl");
            if (avatarEl && !avatarEl.querySelector("img")) {
                avatarEl.textContent = initials;
            }
        }

        // ✅ Clear password field after successful save
        if (passwordEl) passwordEl.value = "";

        showToast("Changes saved!");

    } catch (err) {
        console.error("saveAccountSettings error:", err);
        showToast("Network error. Please try again.");
    }
}

/* ── ADDRESS — save / load ───────────────────────────────────────────────── */
function loadSavedAddress() {
    const saved = JSON.parse(localStorage.getItem("maktaba_address") || "{}");
    if (saved.fullName) document.getElementById("addr-name").value   = saved.fullName;
    if (saved.street)   document.getElementById("addr-street").value = saved.street;
    if (saved.city)     document.getElementById("addr-city").value   = saved.city;
    if (saved.phone)    document.getElementById("addr-phone").value  = saved.phone;
}

function saveAddress() {
    const data = {
        fullName: document.getElementById("addr-name").value.trim(),
        street:   document.getElementById("addr-street").value.trim(),
        city:     document.getElementById("addr-city").value.trim(),
        phone:    document.getElementById("addr-phone").value.trim()
    };
    localStorage.setItem("maktaba_address", JSON.stringify(data));
    showToast("Address saved!");
}

/* ── PAYMENT — save / load ───────────────────────────────────────────────── */
function loadSavedPayment() {
    const saved = JSON.parse(localStorage.getItem("maktaba_payment") || "{}");
    if (saved.cardNumber)  document.getElementById("pay-card").value      = saved.cardNumber;
    if (saved.cardExpiry)  document.getElementById("pay-expiry").value    = saved.cardExpiry;
    if (saved.cardName)    document.getElementById("pay-card-name").value = saved.cardName;
    if (saved.payMethod) {
        document.getElementById("pay-method").value = saved.payMethod;
    }
}

function savePayment() {
    const data = {
        payMethod:   document.getElementById("pay-method").value,
        cardNumber:  document.getElementById("pay-card")?.value.trim(),
        cardExpiry:  document.getElementById("pay-expiry")?.value.trim(),
        cardName:    document.getElementById("pay-card-name")?.value.trim()
    };
    localStorage.setItem("maktaba_payment", JSON.stringify(data));
    showToast("Payment details saved!");
}

/* ── ORDER HISTORY — from MongoDB ────────────────────────────────────────── */
async function loadOrderHistory() {
    const list = document.getElementById("orders-list");
    if (!list) return;

    if (!getEmail()) {
        list.innerHTML = `<div class="orders-empty"><p>Please sign in to view your orders.</p></div>`;
        return;
    }

    list.innerHTML = `<div class="orders-empty"><p>Loading orders…</p></div>`;

    try {
        const res    = await fetch("/orders/history", { headers: authHeaders() });
        const data   = await res.json();
        const orders = data.orders || [];

        if (orders.length === 0) {
            list.innerHTML = `<div class="orders-empty"><p>No orders yet.</p><p>Your completed orders will appear here.</p></div>`;
            return;
        }

        const statusLabel = { processing: "Processing", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };

        list.innerHTML = orders.map((order) => {
            const date  = new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const items = (order.items || []).slice(0, 3).map(it => `<span class="order-item-pill">${it.title}</span>`).join("");
            const more  = order.items.length > 3 ? `<span class="order-item-pill">+${order.items.length - 3} more</span>` : "";
            return `
            <div class="order-card-item">
                <div class="order-card-header">
                    <span class="order-card-id">#MKTBA-${order._id.slice(-6).toUpperCase()}</span>
                    <span class="order-status-badge order-status-${order.orderStatus}">${statusLabel[order.orderStatus] || order.orderStatus}</span>
                </div>
                <div class="order-card-date">${date}</div>
                <div class="order-items-preview">${items}${more}</div>
                <div class="order-card-footer">
                    <span class="order-total-label">Total: <strong class="order-total-amount">&euro;${order.totalAmount.toFixed(2)}</strong></span>
                    <button class="track-btn" onclick="openTracking('${order._id}','${order.orderStatus}','${order.createdAt}')">Track Order</button>
                </div>
            </div>`;
        }).join("");

    } catch (err) {
        list.innerHTML = `<div class="orders-empty"><p>Could not load orders.</p></div>`;
    }
}

/* ── TRACKING MODAL ──────────────────────────────────────────────────────── */
function openTracking(orderId, currentStatus, createdAt) {
    const placed   = new Date(createdAt);
    const delivery = new Date(placed);
    delivery.setDate(placed.getDate() + 7);
    const fmt = d => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const statusOrder = ["processing", "shipped", "delivered"];
    const currentIdx  = statusOrder.indexOf(currentStatus);

    const steps = [
        { label: "Order Confirmed", detail: fmt(placed) },
        { label: "Shipped",         detail: "On the way to you" },
        { label: "Delivered",       detail: "Estimated: " + fmt(delivery) }
    ];

    document.getElementById("tracking-order-ref").textContent = "#MKTBA-" + orderId.slice(-6).toUpperCase();
    document.getElementById("tracking-timeline").innerHTML = steps.map((step, i) => {
        const isDone   = i < currentIdx;
        const isActive = i === currentIdx;
        const cls      = isDone ? "done" : isActive ? "active" : "";
        const icon     = isDone ? "&#10003;" : isActive ? "&#9679;" : "&#9675;";
        const detail   = (isDone || isActive) ? step.detail : "&mdash;";
        return `
        <div class="track-step ${cls}">
            <div class="track-icon">${icon}</div>
            <div class="track-info"><h4>${step.label}</h4><p>${detail}</p></div>
        </div>`;
    }).join("");

    document.getElementById("tracking-modal-overlay").classList.add("open");
}

function closeTracking() {
    document.getElementById("tracking-modal-overlay").classList.remove("open");
}

function renderFavoritesPage() {
    const list = document.querySelector('.favorites-list');
    if (!list) return;

    const favoriteBooks = getFavoriteBooks();

    if (favoriteBooks.length === 0) {
        list.innerHTML = `
            <div class="favorites-empty">
                <p>You don't have any favorites yet.</p>
                <a class="favorites-empty-link" href="../catalog(Marwan)/collection.html">Browse the collection</a>
            </div>
        `;
        return;
    }

    list.innerHTML = favoriteBooks.map(book => {
        const image = resolveAssetPath(book.image || book.cover || '../../resources/img/book-placeholder.png');
        const author = book.author || 'Unknown author';
        const price = Number(book.price) ? Number(book.price).toFixed(2) : String(book.price || '0.00');
        const category = book.genre || book.category || 'General';

          return `
            <div class="favorite-item" data-title="${book.title}">
                <div class="favorite-left">
                    <img src="${image}" alt="${book.title}">
                    <div class="favorite-info">
                        <span class="favorite-category">${category}</span>
                        <h3>${book.title}</h3>
                        <p>${author}</p>
                    </div>
                </div>
                <div class="favorite-right">
                    <span class="favorite-price">&euro;${price}</span>
                    <button class="favorite-bag-btn" data-title="${book.title}" data-author="${author}" data-price="${price}" data-image="${image}" aria-label="Add ${book.title} to cart">
                        <span class="material-symbols-outlined">shopping_bag</span>
                    </button>
                    <button class="favorite-heart-btn${isFavorite(book.title) ? ' active' : ''}" data-title="${book.title}" aria-label="Remove ${book.title} from favorites">
                        <span class="material-symbols-outlined">favorite</span>
                    </button>
                    <button class="favorite-remove-btn" type="button" data-title="${book.title}">Remove</button>
                </div>
            </div>
        `;
    }).join('');

    attachFavoritesPageListeners();
}

function attachFavoritesPageListeners() {
    document.querySelectorAll('.favorite-bag-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const book = {
                title: this.dataset.title,
                author: this.dataset.author,
                price: this.dataset.price,
                image: this.dataset.image,
                qty: 1
            };
            addBookToCart(book);
            const cover = this.closest('.favorite-item')?.querySelector('img');
            flyToCart(cover);
        });
    });

    document.querySelectorAll('.favorite-heart-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const title = this.dataset.title;
            const nowFav = toggleFavorite(title);
            updateFavoriteButton(this, title);
            if (!nowFav) {
                renderFavoritesPage();
            }
        });
    });

    document.querySelectorAll('.favorite-remove-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const title = this.dataset.title;
            toggleFavorite(title);
            renderFavoritesPage();
        });
    });
}

/* ── AUTO-INIT ───────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
    // ✅ FIX: load account settings on page load (account tab is default)
    loadAccountSettings();

    if (document.getElementById("tab-orders")?.classList.contains("active")) loadOrderHistory();
    if (document.querySelector('.favorites-list')) renderFavoritesPage();
});