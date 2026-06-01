// ─────────────────────────────────────────────────────────────────────────────
//  account.js  —  Maktaba  |  Settings + Favorites (DB-backed)
//  Relies on the shared MAKTABA helper defined in /script.js.
// ─────────────────────────────────────────────────────────────────────────────

function val(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v || ''; }

function toast(msg) {
    if (window.MAKTABA) return MAKTABA.toast(msg);
    const t = document.getElementById("toast");
    if (!t) { alert(msg); return; }
    t.textContent = msg || "Saved";
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2200);
}
// Kept for any inline onclick="showToast(...)" left in the markup.
function showToast(msg) { toast(msg); }

function loggedIn() { return window.MAKTABA && MAKTABA.isLoggedIn(); }

/* ── TAB SWITCHING ───────────────────────────────────────────────────────── */
function showTab(name, btn) {
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    const panel = document.getElementById("tab-" + name);
    if (panel) panel.classList.add("active");
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");

    if (name === "orders") loadOrderHistory();
}

/* ── AVATAR (local preview only — not persisted) ─────────────────────────── */
function previewAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        const el = document.getElementById("avatarEl");
        if (el) el.innerHTML = `<img src="${ev.target.result}">`;
    };
    reader.readAsDataURL(file);
}
function removeAvatar() {
    const el = document.getElementById("avatarEl");
    if (el) el.textContent = initialsFromName(MAKTABA.getUser()?.name);
}
function initialsFromName(name) {
    if (!name) return "U";
    return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

/* ── LOAD PROFILE INTO THE FORM ──────────────────────────────────────────── */
async function loadProfile() {
    if (!loggedIn()) { toast("Please log in to manage your account."); return; }
    try {
        const res = await MAKTABA.authFetch("/api/auth/me");
        const data = await res.json();
        if (!res.ok) { toast(data.error || "Could not load profile."); return; }
        const u = data.user;

        setVal("acc-name", u.name);
        setVal("acc-email", u.email);
        const avatarEl = document.getElementById("avatarEl");
        if (avatarEl && !avatarEl.querySelector("img")) avatarEl.textContent = initialsFromName(u.name);

        // Address
        if (u.address) {
            setVal("addr-name", u.address.fullName);
            setVal("addr-street", u.address.street);
            setVal("addr-city", u.address.city);
            setVal("addr-phone", u.address.phone);
        }
        // Payment (only a masked summary is stored)
        if (u.payment) {
            setVal("pay-card-name", u.payment.cardName);
            setVal("pay-expiry", u.payment.expiry);
            const cardEl = document.getElementById("pay-card");
            if (cardEl && u.payment.last4) cardEl.placeholder = `•••• •••• •••• ${u.payment.last4}`;
            if (u.payment.method) {
                const hidden = document.getElementById("pay-method");
                if (hidden) hidden.value = u.payment.method;
            }
        }
    } catch (err) {
        toast("Could not reach the server.");
    }
}

/* ── SAVE ACCOUNT (name, email, optional password change) ────────────────── */
async function saveAccount() {
    if (!loggedIn()) { toast("Please log in."); return; }
    const name = val("acc-name");
    const email = val("acc-email");

    try {
        const res = await MAKTABA.authFetch("/api/auth/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email }),
        });
        const data = await res.json();
        if (!res.ok) { toast(data.error || "Could not save changes."); return; }

        // Keep local copy + navbar in sync.
        try {
            localStorage.setItem("maktabaUserName", data.user.name);
            localStorage.setItem("maktabaUserEmail", data.user.email);
            const stored = JSON.parse(localStorage.getItem("maktabaLoggedInUser") || "{}");
            stored.name = data.user.name; stored.email = data.user.email;
            localStorage.setItem("maktabaLoggedInUser", JSON.stringify(stored));
        } catch (e) {}
        if (typeof updateNavbarAuth === "function") updateNavbarAuth();

        toast("Changes saved");
    } catch (err) {
        toast("Could not reach the server.");
    }
}

/* ── CHANGE PASSWORD (Privacy tab) ───────────────────────────────────────── */
async function changePassword() {
    if (!loggedIn()) { toast("Please log in."); return; }
    const current = val("acc-current-password");
    const next = val("acc-password");
    if (!current || !next) { toast("Enter your current and new password."); return; }
    if (next.length < 8) { toast("New password must be at least 8 characters."); return; }

    try {
        const res = await MAKTABA.authFetch("/api/auth/password", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentPassword: current, newPassword: next }),
        });
        const data = await res.json();
        if (!res.ok) { toast(data.error || "Password change failed."); return; }
        setVal("acc-current-password", "");
        setVal("acc-password", "");
        toast("Password updated.");
    } catch (err) {
        toast("Could not reach the server.");
    }
}

/* ── ADDRESS ─────────────────────────────────────────────────────────────── */
async function saveAddress() {
    if (!loggedIn()) { toast("Please log in."); return; }
    const address = {
        fullName: val("addr-name"),
        street: val("addr-street"),
        city: val("addr-city"),
        phone: val("addr-phone"),
    };
    try {
        const res = await MAKTABA.authFetch("/api/auth/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address }),
        });
        if (!res.ok) { const d = await res.json(); toast(d.error || "Could not save address."); return; }
        toast("Address saved!");
    } catch (err) { toast("Could not reach the server."); }
}

/* ── PAYMENT (only a masked summary is stored server-side) ───────────────── */
async function savePayment() {
    if (!loggedIn()) { toast("Please log in."); return; }
    const payment = {
        method: val("pay-method") || "credit_debit",
        cardName: val("pay-card-name"),
        cardNumber: val("pay-card"),  // backend keeps only the last 4 digits
        expiry: val("pay-expiry"),
    };
    try {
        const res = await MAKTABA.authFetch("/api/auth/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payment }),
        });
        if (!res.ok) { const d = await res.json(); toast(d.error || "Could not save payment."); return; }
        toast("Payment details saved!");
    } catch (err) { toast("Could not reach the server."); }
}

/* ── ORDER HISTORY — from MongoDB ────────────────────────────────────────── */
async function loadOrderHistory() {
    const list = document.getElementById("orders-list");
    if (!list) return;

    if (!loggedIn()) {
        list.innerHTML = `<div class="orders-empty"><p>Please sign in to view your orders.</p></div>`;
        return;
    }
    list.innerHTML = `<div class="orders-empty"><p>Loading orders…</p></div>`;

    try {
        const res = await MAKTABA.authFetch("/api/orders/mine");
        const data = await res.json();
        const orders = data.orders || [];

        if (orders.length === 0) {
            list.innerHTML = `<div class="orders-empty"><p>No orders yet.</p><p>Your completed orders will appear here.</p></div>`;
            return;
        }

        const statusLabel = { pending: "Pending", confirmed: "Confirmed", processing: "Processing", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };

        list.innerHTML = orders.map((order) => {
            const date = new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const items = (order.items || []).slice(0, 3).map(it => `<span class="order-item-pill">${it.title}</span>`).join("");
            const more = order.items.length > 3 ? `<span class="order-item-pill">+${order.items.length - 3} more</span>` : "";
            const total = order.orderSummary && typeof order.orderSummary.total === "number" ? order.orderSummary.total : 0;
            const status = order.status || "confirmed";
            return `
            <div class="order-card-item">
                <div class="order-card-header">
                    <span class="order-card-id">${order.orderNumber || ("#MKTBA-" + String(order._id).slice(-6).toUpperCase())}</span>
                    <span class="order-status-badge order-status-${status}">${statusLabel[status] || status}</span>
                </div>
                <div class="order-card-date">${date}</div>
                <div class="order-items-preview">${items}${more}</div>
                <div class="order-card-footer">
                    <span class="order-total-label">Total: <strong class="order-total-amount">&euro;${total.toFixed(2)}</strong></span>
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
    const placed = new Date(createdAt);
    const delivery = new Date(placed);
    delivery.setDate(placed.getDate() + 7);
    const fmt = d => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const statusOrder = ["processing", "shipped", "delivered"];
    const currentIdx = statusOrder.indexOf(currentStatus);

    const steps = [
        { label: "Order Confirmed", detail: fmt(placed) },
        { label: "Shipped", detail: "On the way to you" },
        { label: "Delivered", detail: "Estimated: " + fmt(delivery) }
    ];

    document.getElementById("tracking-order-ref").textContent = "#MKTBA-" + String(orderId).slice(-6).toUpperCase();
    document.getElementById("tracking-timeline").innerHTML = steps.map((step, i) => {
        const isDone = i < currentIdx;
        const isActive = i === currentIdx;
        const cls = isDone ? "done" : isActive ? "active" : "";
        const icon = isDone ? "&#10003;" : isActive ? "&#9679;" : "&#9675;";
        const detail = (isDone || isActive) ? step.detail : "&mdash;";
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

/* ── FAVORITES PAGE (favorites.html) ─────────────────────────────────────── */
async function loadFavoritesPage() {
    const list = document.querySelector(".favorites-list");
    if (!list) return; // not on the favorites page

    if (!loggedIn()) {
        list.innerHTML = `<p style="padding:40px 0;color:#8C7B75;">Please <a href="/pages/authentication(Ali)/signin.html">log in</a> to see your favorites.</p>`;
        return;
    }

    try {
        const res = await MAKTABA.authFetch("/api/auth/favorites");
        const data = await res.json();
        const favs = (data && data.favorites) || [];

        if (favs.length === 0) {
            list.innerHTML = `<p style="padding:40px 0;color:#8C7B75;">You haven't added any favorites yet.</p>`;
            return;
        }

        list.innerHTML = favs.map(b => {
            const img = b.image && b.image.startsWith("http") ? b.image : "/" + (b.image || "");
            return `
            <div class="favorite-item" data-id="${b._id}">
                <div class="favorite-left">
                    <img src="${img}" alt="${b.title}" onerror="this.style.background='#d4c4b0';this.removeAttribute('src')">
                    <div class="favorite-info">
                        <span class="favorite-category">${b.genre || ""}</span>
                        <h3 class="favorite-name">${b.title}</h3>
                        <p class="favorite-writer">${b.author || ""}</p>
                    </div>
                </div>
                <div class="favorite-right">
                    <span class="favorite-price">&euro;${(Number(b.price) || 0).toFixed(2)}</span>
                    <button class="favorite-bag-btn" aria-label="Add to cart">
                        <span class="material-symbols-outlined">shopping_bag</span>
                    </button>
                    <button class="favorite-heart-btn active" aria-label="Remove from favorites">
                        <span class="material-symbols-outlined">favorite</span>
                    </button>
                </div>
            </div>`;
        }).join("");

        // Wire dynamic buttons.
        list.querySelectorAll(".favorite-item").forEach((row, i) => {
            const b = favs[i];
            row.querySelector(".favorite-bag-btn").addEventListener("click", () => {
                const qty = window.addBookToCart({
                    bookId: b._id, title: b.title, author: b.author,
                    price: b.price, image: b.image, qty: 1,
                });
                if (qty) toast(`Added "${b.title}" to cart.`);
            });
            row.querySelector(".favorite-heart-btn").addEventListener("click", async () => {
                try {
                    const r = await MAKTABA.authFetch(`/api/auth/favorites/${b._id}`, { method: "DELETE" });
                    if (r.ok) { row.remove(); if (!list.querySelector(".favorite-item")) loadFavoritesPage(); }
                } catch (e) { toast("Could not update favorites."); }
            });
        });
    } catch (err) {
        list.innerHTML = `<p style="padding:40px 0;color:#8C7B75;">Could not load favorites.</p>`;
    }
}

/* ── AUTO-INIT ───────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
    // Settings page
    if (document.getElementById("tab-account")) {
        loadProfile();
        if (document.getElementById("tab-orders")?.classList.contains("active")) loadOrderHistory();
    }
    // Favorites page
    loadFavoritesPage();
});
