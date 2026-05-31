// ─────────────────────────────────────────────────────────────────────────────
//  account.js  —  Maktaba  |  Settings Page
// ─────────────────────────────────────────────────────────────────────────────

function getEmail() {
    return localStorage.getItem("userEmail") || localStorage.getItem("email") || "";
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

/* ── AUTO-INIT ───────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("tab-orders")?.classList.contains("active")) loadOrderHistory();
});