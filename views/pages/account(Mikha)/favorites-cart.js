function getEmail() {
    return localStorage.getItem("maktabaUserEmail") || "";
}

function authHeaders() {
    return {
        "Content-Type": "application/json",
        "x-user-email": getEmail()
    };
}

function showCartToast(msg, type) {
    let toast = document.getElementById("cart-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "cart-toast";
        toast.style.cssText = `
            position:fixed; bottom:28px; right:28px; padding:13px 22px;
            font-family:'DM Sans',sans-serif; font-size:14px; color:#fff;
            z-index:9999; opacity:0; transition:opacity .3s; pointer-events:none;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.background = type === "error" ? "#c0392b" : "#312F2C";
    toast.style.opacity = "1";
    setTimeout(() => toast.style.opacity = "0", 2800);
}

async function addToCartFromFavorites(btn) {
    const title  = btn.dataset.title;
    const author = btn.dataset.author;
    const price  = parseFloat(btn.dataset.price);
    const image  = btn.dataset.image;

    // ── حفظ في localStorage عشان الـ checkout يشتغل ──
    const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const exists = localCart.find(i => i.title === title);
    if (!exists) {
        localCart.push({ title, author, price, image, qty: 1 });
    } else {
        exists.qty = (exists.qty || 1) + 1;
    }
    localStorage.setItem("cart", JSON.stringify(localCart));

    showCartToast(`"${title}" added to cart!`);

    // ── حفظ في DB لو logged in ──
    if (getEmail()) {
        try {
            const bookRes = await fetch(`/books/title/${encodeURIComponent(title)}`);
            const bookData = await bookRes.json();
            if (bookData._id) {
                await fetch("/cart/add", {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({
                        bookId: bookData._id,
                        title, author, price, image
                    })
                });
            }
        } catch (_) {}
    }

    // visual feedback
    const icon = btn.querySelector(".material-symbols-outlined");
    if (icon) icon.textContent = "check";
    btn.style.background = "#312F2C";
    btn.style.color = "#fff";
    setTimeout(() => {
        if (icon) icon.textContent = "shopping_bag";
        btn.style.background = "";
        btn.style.color = "";
    }, 1800);
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".favorite-bag-btn").forEach(btn => {
        btn.addEventListener("click", () => addToCartFromFavorites(btn));
    });
});