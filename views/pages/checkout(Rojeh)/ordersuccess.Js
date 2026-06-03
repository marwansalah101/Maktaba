async function saveOrderToDB() {
    // منع التكرار لو الصفحة اتفتحت تاني
   

    const email    = localStorage.getItem("maktabaUserEmail") || "";
    const cart     = JSON.parse(localStorage.getItem("cart") || "[]");
    const shipping = JSON.parse(localStorage.getItem("shippingInfo") || "{}");

    if (!email || cart.length === 0) return;

    const items = cart.map(item => ({
        bookId:   item._id  || item.bookId || "000000000000000000000000",
        title:    item.title,
        author:   item.author  || "",
        price:    parseFloat(item.price),
        image:    item.image   || "",
        quantity: item.qty     || 1
    }));

    const shippingAddress = {
        fullName: `${shipping.firstName || ""} ${shipping.lastName || ""}`.trim(),
        address:  `${shipping.street || ""} ${shipping.number || ""}`.trim(),
        city:     shipping.place   || "",
        phone:    shipping.phone   || ""
    };

    try {
        const res  = await fetch("/orders/create", {
            method:  "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-email": email
            },
            body: JSON.stringify({
                paymentMethod: "cash_on_delivery",
                shippingAddress,
                items
            })
        });

        const data = await res.json();

        if (data.success) {
            // منع التكرار
            
            // امسح الـ cart بعد الحفظ
            localStorage.removeItem("cart");
            localStorage.removeItem("shippingInfo");

            // Order ID
            const idEl = document.querySelector(".order-card-header span");
            if (idEl && data.orderId) {
                idEl.textContent = "#MKTBA-" + data.orderId.slice(-6).toUpperCase();
            }

            // Shipping address
            const shipEl = document.getElementById("shipping-address");
            if (shipEl) {
                shipEl.innerHTML = `
                    <p>${shippingAddress.fullName}</p>
                    <p>${shippingAddress.address}</p>
                    <p>${shippingAddress.city}</p>
                    <p>${shipping.email || email}</p>
                `;
            }

            // Order items
            const listEl  = document.getElementById("order-items-list");
            const totalEl = document.getElementById("order-total");
            if (listEl) {
                let total = 0;
                listEl.innerHTML = items.map(item => {
                    total += item.price * item.quantity;
                    return `
                    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #eee;">
                        <img src="${item.image}" alt="${item.title}"
                             style="width:48px;height:64px;object-fit:cover;border-radius:3px;"
                             onerror="this.style.background='#eee';this.removeAttribute('src')">
                        <div style="flex:1">
                            <p style="font-size:14px;margin:0 0 3px">${item.title}</p>
                            <p style="font-size:12px;color:#aaa;margin:0">× ${item.quantity}</p>
                        </div>
                        <p style="font-size:14px;color:#C8922a">€${(item.price * item.quantity).toFixed(2)}</p>
                    </div>`;
                }).join("");
                if (totalEl) totalEl.textContent = `€${(total + 5).toFixed(2)}`;
            }

            // Dates
            const now      = new Date();
            const delivery = new Date();
            delivery.setDate(now.getDate() + 7);
            const fmt = d => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            document.querySelectorAll("[data-order-date]").forEach(el => el.textContent = fmt(now));
            document.querySelectorAll("[data-delivery-date]").forEach(el => el.textContent = fmt(delivery));

            // Toast
            const toast = document.getElementById("toast");
            if (toast) {
                toast.classList.add("show");
                setTimeout(() => toast.classList.remove("show"), 4000);
            }
        }
    } catch (err) {
        console.error("Order save error:", err);
    }
}
saveOrderToDB();