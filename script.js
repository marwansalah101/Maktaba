const menuBtn = document.getElementById('menuBtn');
const menuDropdown = document.getElementById('menuDropdown');
const menuWrapper = document.querySelector('.menu-dropdown-wrapper');

if (menuBtn && menuDropdown && menuWrapper) {
    // Break dropdown out of navbar to avoid overflow:hidden clipping
    document.body.appendChild(menuDropdown);

    const positionDropdown = () => {
        const btnRect = menuBtn.getBoundingClientRect();
        // Position fixed just below the button and aligned to its right edge
        menuDropdown.style.top = (btnRect.bottom + 15) + 'px';
        menuDropdown.style.left = (btnRect.right - menuDropdown.offsetWidth) + 'px';
    };

    window.addEventListener('resize', positionDropdown);
    window.addEventListener('scroll', positionDropdown);

    let hoverTimeout;

    // Hover logic
    menuWrapper.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        positionDropdown();
        menuDropdown.classList.add('open');
    });

    menuWrapper.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(() => {
            menuDropdown.classList.remove('open');
        }, 400); // slight delay for smooth hover
    });

    menuDropdown.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
    });

    menuDropdown.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(() => {
            menuDropdown.classList.remove('open');
        }, 400);
    });

    // Click logic
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        positionDropdown();
        menuDropdown.classList.toggle('open');
    });

    menuWrapper.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    menuDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    document.addEventListener('click', () => {
        menuDropdown.classList.remove('open');
    });
}
//Filters box
const btn = document.getElementById('toggleBtn');
const box = document.getElementById('expandBox');

if (btn && box) {
    btn.addEventListener('click', () => {
        box.classList.toggle('open');
        console.log("Filter menu toggled!");
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






/*order succes*/
const orderData = {
    items: [
        {
            title: "Midnight Letters",
            price: 19.00,
            qty: 1,
            img: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=300&fit=crop"
        },
        {
            title: "Echoes of Tomorrow",
            price: 29.00,
            qty: 1,
            img: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=300&fit=crop"
        },
        {
            title: "The Silent Garden",
            price: 24.00,
            qty: 1,
            img: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=200&h=300&fit=crop"
        }
    ]
};

function renderOrder() {
    const listContainer = document.getElementById("order-items-list");
    const totalElement = document.getElementById("order-total");

    if (!listContainer || !totalElement) return;

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    let total = 0;
    listContainer.innerHTML = "";

    cart.forEach(item => {
        const qty = item.qty || 1;
        const price = parseFloat(item.price);
        total += price * qty;
        
        const basePath = window.location.pathname.includes('/pages/') ? '../../' : './';

        const itemCard = document.createElement("div");
        itemCard.className = "order-item";

        itemCard.innerHTML = `
            <img src="${basePath}${item.image}" alt="${item.title}">
            <div class="order-item-info">
                <h4>${item.title}</h4>
                <p>QTY: ${qty}</p>
            </div>
            <div class="order-item-price">€${price.toFixed(2)}</div>
        `;

        listContainer.appendChild(itemCard);
    });

    totalElement.textContent = `€${total.toFixed(2)}`;
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

/*favorites*/
const favoritesData = [
    { category: "FICTION", title: "The Silent Garden", author: "Eleanor Voss", price: "24.00", img: "HarryPotter.jpg" },
    { category: "MYSTERY", title: "Midnight Letters", author: "James Hartley", price: "19.00", img: "GreatGasby.jpg" },
    { category: "SCI-FI", title: "Echoes of Tomorrow", author: "Sana Mirza", price: "29.00", img: "Dune.jpg" }
];

function renderFavs() {
    const list = document.getElementById('fav-list');
    if (!list) return;

    list.innerHTML = favoritesData.map(item => `
        <div class="fav-item">
            <img src="${item.img}" class="fav-img">
            <div class="fav-info">
                <div class="fav-category">${item.category}</div>
                <h3 class="fav-title">${item.title}</h3>
                <p class="fav-author">${item.author}</p>
            </div>
            <div class="fav-price">€${item.price}</div>
            <div class="actions">
                <button class="cart-btn">🛒</button>
                <button class="heart-btn active" onclick="toggleHeart(this)">❤</button>
            </div>
        </div>
    `).join('');
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

function toggleHeart(btn) {
    btn.classList.toggle('active');
}


document.addEventListener("DOMContentLoaded", function () {
    const hearts = document.querySelectorAll(".favorite-heart-btn");

    hearts.forEach(btn => {
        btn.addEventListener("click", function () {
            this.classList.toggle("active");
        });
    });
});
/*favorites*/
document.addEventListener("DOMContentLoaded", function () {
    const bagBtns = document.querySelectorAll(".favorite-bag-btn");

    bagBtns.forEach(btn => {
        btn.addEventListener("click", function () {
            const book = {
                title: this.dataset.title,
                author: this.dataset.author,
                price: this.dataset.price,
                image: this.dataset.image,
                qty: 1
            };

            let cart = JSON.parse(localStorage.getItem("cart")) || [];
            const exists = cart.find(item => item.title === book.title);

            if (!exists) {
                cart.push(book);
                localStorage.setItem("cart", JSON.stringify(cart));
                alert(book.title + " added to cart!");
            } else {
                alert(book.title + " is already in your cart!");
            }
        });
    });

    const hearts = document.querySelectorAll(".favorite-heart-btn");
    hearts.forEach(btn => {
        btn.addEventListener("click", function () {
            this.classList.toggle("active");
        });
    });
});
/*add to cart* /
/* ===== ADD TO CART PAGE JS ===== */

const CART_SHIPPING = 5;

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
    if (!subEl) return;
    subEl.textContent = `€${subtotal.toFixed(2)}`;
    shipEl.textContent = `€${shipping.toFixed(2)}`;
    totalEl.textContent = `€${(subtotal + shipping).toFixed(2)}`;
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
        const qty = book.qty || 1;
        const price = parseFloat(book.price);
        subtotal += price * qty;

        const basePath = window.location.pathname.includes('/pages/') ? '../../' : './';

        const item = document.createElement('div');
        item.className = 'cart-item';
        item.innerHTML = `
            <img class="cart-item-img" src="${basePath}${book.image}" alt="${book.title}">
            <div class="cart-item-info">
                <h3>${book.title}</h3>
                <p>${book.author}</p>
                <div class="qty-row">
                    <button class="qty-btn" onclick="changeQty(${index}, -1)">−</button>
                    <span class="qty-value">${qty}</span>
                    <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                </div>
            </div>
            <div class="cart-item-price">€${(price * qty).toFixed(2)}</div>
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
            const basePath = window.location.pathname.includes('/pages/') ? '../../' : './';
            window.location.href = basePath + 'pages/checkout(Rojeh)/checkout.html';
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

        const basePath = window.location.pathname.includes('/pages/') ? '../../' : './';
        if (cart.length === 0) {
            list.innerHTML = '<p style="color:#aaa;font-size:13px;padding:10px 0;">Your cart is empty.</p>';
        } else {
            list.innerHTML = cart.map(item => {
                const qty = item.qty || 1;
                const price = parseFloat(item.price);
                subtotal += price * qty;
                return `
                    <div class="checkout-order-item">
                        <img class="checkout-book-cover"
                             src="${basePath}${item.image || ''}"
                             alt="${item.title}"
                             onerror="this.style.background='#d4c4b0';this.removeAttribute('src')">
                        <div class="checkout-item-info">
                            <div class="checkout-item-title">${item.title}</div>
                            <div class="checkout-item-qty">QTY: ${qty}</div>
                        </div>
                        <div class="checkout-item-price">€${(price * qty).toFixed(2)}</div>
                    </div>
                `;
            }).join('');
        }

        const shipping = cart.length > 0 ? 5 : 0;
        if (subtotalEl) subtotalEl.textContent = `€${subtotal.toFixed(2)}`;
        if (shippingEl) shippingEl.textContent = `€${shipping.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `€${(subtotal + shipping).toFixed(2)}`;
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
            lastName: document.getElementById('co-lname').value,
            email: document.getElementById('co-email').value,
            street: document.getElementById('co-street').value,
            number: document.getElementById('co-number').value,
            postcode: document.getElementById('co-postcode').value,
            place: document.getElementById('co-place').value,
            country: document.getElementById('co-country').value
        }));

        const basePath = window.location.pathname.includes('/pages/') ? '../../' : './';
        window.location.href = basePath + 'pages/checkout(Rojeh)/order-success.html';
    });
});





/* THE FOOTER LINKS */


const footerLinks = document.querySelectorAll('.footer-link');

footerLinks.forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();


        const targetId = this.getAttribute('data-target');
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
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
        }
    });
});

/* Active page indicator — highlights current page link in navbar */
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
