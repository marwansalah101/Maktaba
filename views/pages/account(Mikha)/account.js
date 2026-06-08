// ─────────────────────────────────────────────────────────────────────────────
//  account.js  —  Maktaba  |  Settings Page  (connected to the User collection)
// ─────────────────────────────────────────────────────────────────────────────

const MK_BASE = (location.port === "3000") ? "" : "http://localhost:3000";
let MK_USER = null; // cached profile loaded from /api/auth/me

function getToken() { return localStorage.getItem("maktabaToken") || ""; }
function isLoggedIn() { return !!getToken(); }
function authHeaders() {
    const h = { "Content-Type": "application/json" };
    const t = getToken();
    if (t) h["Authorization"] = "Bearer " + t;
    return h;
}

/* ── TAB SWITCHING ───────────────────────────────────────────────────────── */
function showTab(name, btn) {
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    document.getElementById("tab-" + name).classList.add("active");
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");

    if (name === "orders")  loadOrderHistory();
    if (name === "address") loadSavedAddress();
    if (name === "payment") loadSavedPayment();
    if (name === "account") loadAccountSettings();
}

/* ── TOAST ───────────────────────────────────────────────────────────────── */
function showToast(msg) {
    // Prefer the shared dark bottom-right toast when available.
    if (typeof window.mkToast === "function") { window.mkToast(msg || "Saved"); return; }
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

/* ── PROFILE LOAD (one call powers account + address + payment) ──────────── */
async function loadProfile(force) {
    if (MK_USER && !force) return MK_USER;
    if (!isLoggedIn()) return null;
    try {
        const res = await fetch(MK_BASE + "/api/auth/me", { headers: authHeaders() });
        if (!res.ok) return null;
        const data = await res.json();
        MK_USER = data.user || null;
        return MK_USER;
    } catch (err) {
        console.error("loadProfile error:", err);
        return null;
    }
}

/* ── ACCOUNT SETTINGS — load / save ─────────────────────────────────────── */
async function loadAccountSettings() {
    const user = await loadProfile();
    if (!user) return;
    const nameEl  = document.getElementById("acc-name");
    const emailEl = document.getElementById("acc-email");
    if (nameEl  && user.name)  nameEl.value  = user.name;
    if (emailEl && user.email) emailEl.value = user.email;

    // avatar initials
    const avatarEl = document.getElementById("avatarEl");
    if (avatarEl && !avatarEl.querySelector("img") && user.name) {
        avatarEl.textContent = user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    }
}

async function saveAccountSettings() {
    if (!isLoggedIn()) { showToast("Please sign in first."); return; }
    const nameEl     = document.getElementById("acc-name");
    const emailEl    = document.getElementById("acc-email");
    const passwordEl = document.getElementById("acc-password");

    const payload = {};
    if (nameEl?.value.trim())     payload.name     = nameEl.value.trim();
    if (emailEl?.value.trim())    payload.email    = emailEl.value.trim();
    if (passwordEl?.value.trim()) payload.password = passwordEl.value.trim();
    if (Object.keys(payload).length === 0) { showToast("Nothing to save."); return; }

    try {
        const res = await fetch(MK_BASE + "/api/auth/profile", {
            method: "PUT", headers: authHeaders(), body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { showToast(data.error || "Could not save. Please try again."); return; }

        MK_USER = data.user || MK_USER;
        if (data.user?.email) {
            localStorage.setItem("maktabaUserEmail", data.user.email);
        }
        if (data.user?.name) {
            localStorage.setItem("maktabaUserName", data.user.name);
            const avatarEl = document.getElementById("avatarEl");
            if (avatarEl && !avatarEl.querySelector("img")) {
                avatarEl.textContent = data.user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            }
        }
        if (passwordEl) passwordEl.value = "";
        showToast("Changes saved!");
    } catch (err) {
        console.error("saveAccountSettings error:", err);
        showToast("Network error. Please try again.");
    }
}

/* ── ADDRESS — save / load (User.address) ───────────────────────────────── */
async function loadSavedAddress() {
    const user = await loadProfile();
    const a = (user && user.address) || {};
    const set = (id, v) => { const el = document.getElementById(id); if (el && v) el.value = v; };
    set("addr-name", a.fullName);
    set("addr-street", a.street);
    set("addr-city", a.city);
    set("addr-phone", a.phone);
}

async function saveAddress() {
    if (!isLoggedIn()) { showToast("Please sign in first."); return; }
    const address = {
        fullName: document.getElementById("addr-name")?.value.trim() || "",
        street:   document.getElementById("addr-street")?.value.trim() || "",
        city:     document.getElementById("addr-city")?.value.trim() || "",
        phone:    document.getElementById("addr-phone")?.value.trim() || ""
    };
    try {
        const res = await fetch(MK_BASE + "/api/auth/profile", {
            method: "PUT", headers: authHeaders(), body: JSON.stringify({ address })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { showToast(data.error || "Could not save address."); return; }
        MK_USER = data.user || MK_USER;
        showToast("Address saved!");
    } catch (err) {
        showToast("Network error. Please try again.");
    }
}

/* ── PAYMENT — save / load (User.payment, masked) ───────────────────────── */
async function loadSavedPayment() {
    const user = await loadProfile();
    const p = (user && user.payment) || {};
    const methodEl = document.getElementById("pay-method");
    if (methodEl && p.method) methodEl.value = p.method;
    const nameEl = document.getElementById("pay-card-name");
    if (nameEl && p.cardName) nameEl.value = p.cardName;
    const expEl = document.getElementById("pay-expiry");
    if (expEl && p.expiry) expEl.value = p.expiry;
    const cardEl = document.getElementById("pay-card");
    if (cardEl && p.last4) cardEl.value = "•••• •••• •••• " + p.last4;
}

async function savePayment() {
    if (!isLoggedIn()) { showToast("Please sign in first."); return; }
    const payment = {
        method:     document.getElementById("pay-method")?.value || "",
        cardName:   document.getElementById("pay-card-name")?.value.trim() || "",
        cardNumber: document.getElementById("pay-card")?.value.trim() || "",
        expiry:     document.getElementById("pay-expiry")?.value.trim() || ""
    };
    try {
        const res = await fetch(MK_BASE + "/api/auth/profile", {
            method: "PUT", headers: authHeaders(), body: JSON.stringify({ payment })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { showToast(data.error || "Could not save payment."); return; }
        MK_USER = data.user || MK_USER;
        showToast("Payment details saved!");
        loadSavedPayment();
    } catch (err) {
        showToast("Network error. Please try again.");
    }
}

/* ── ORDER HISTORY — from the User's own orders in MongoDB ───────────────── */
async function loadOrderHistory() {
    const list = document.getElementById("orders-list");
    if (!list) return;

    if (!isLoggedIn()) {
        list.innerHTML = `<div class="orders-empty"><p>Please sign in to view your orders.</p></div>`;
        return;
    }
    list.innerHTML = `<div class="orders-empty"><p>Loading orders…</p></div>`;

    try {
        const res    = await fetch(MK_BASE + "/api/orders/mine", { headers: authHeaders() });
        const data   = await res.json();
        const orders = data.orders || [];

        if (orders.length === 0) {
            list.innerHTML = `<div class="orders-empty"><p>No orders yet.</p><p>Your completed orders will appear here.</p></div>`;
            return;
        }

        const statusLabel = { pending:"Pending", confirmed:"Confirmed", processing:"Processing", shipped:"Shipped", delivered:"Delivered", cancelled:"Cancelled" };

        list.innerHTML = orders.map((order) => {
            const status = order.status || order.orderStatus || "confirmed";
            const total  = (order.orderSummary && typeof order.orderSummary.total === "number")
                ? order.orderSummary.total
                : (typeof order.totalAmount === "number" ? order.totalAmount : 0);
            const date  = new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const ref   = order.orderNumber || ("MKTBA-" + String(order._id).slice(-6).toUpperCase());
            const items = (order.items || []).slice(0, 3).map(it => `<span class="order-item-pill">${it.title}</span>`).join("");
            const more  = (order.items || []).length > 3 ? `<span class="order-item-pill">+${order.items.length - 3} more</span>` : "";
            return `
            <div class="order-card-item">
                <div class="order-card-header">
                    <span class="order-card-id">#${ref}</span>
                    <span class="order-status-badge order-status-${status}">${statusLabel[status] || status}</span>
                </div>
                <div class="order-card-date">${date}</div>
                <div class="order-items-preview">${items}${more}</div>
                <div class="order-card-footer">
                    <span class="order-total-label">Total: <strong class="order-total-amount">&euro;${Number(total).toFixed(2)}</strong></span>
                    <button class="track-btn" onclick="openTracking('${order._id}','${status}','${order.createdAt}')">Track Order</button>
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
    const currentIdx  = Math.max(0, statusOrder.indexOf(currentStatus));

    const steps = [
        { label: "Order Confirmed", detail: fmt(placed) },
        { label: "Shipped",         detail: "On the way to you" },
        { label: "Delivered",       detail: "Estimated: " + fmt(delivery) }
    ];

    document.getElementById("tracking-order-ref").textContent = "#MKTBA-" + String(orderId).slice(-6).toUpperCase();
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

/* ── FAVORITES PAGE (uses shared favorites/cart helpers from script.js) ──── */
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
            if (typeof flyToCart === 'function') flyToCart(cover);
        });
    });

    document.querySelectorAll('.favorite-heart-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const title = this.dataset.title;
            const nowFav = toggleFavorite(title);
            updateFavoriteButton(this, title);
            if (!nowFav) renderFavoritesPage();
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
    loadAccountSettings();
    if (document.getElementById("tab-orders")?.classList.contains("active")) loadOrderHistory();
    if (document.querySelector('.favorites-list')) renderFavoritesPage();
});
