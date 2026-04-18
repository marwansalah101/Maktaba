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
        }, 150); // slight delay for smooth hover
    });

    menuDropdown.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
    });

    menuDropdown.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(() => {
            menuDropdown.classList.remove('open');
        }, 150);
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



// Genre tab background
const ripple = document.getElementById('bgRipple');

if (ripple) {
    const genreCards = document.querySelectorAll('.genre-card[data-color]');
    const genresContainer = document.querySelector('.genres-container');
    const navbar = document.querySelector('.navbar');
    let currentCard = null;

    genreCards.forEach(card => {
        card.addEventListener('mouseenter', (e) => {
            const rect = card.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            ripple.classList.remove('active');
            void ripple.offsetWidth;

            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.backgroundColor = card.dataset.color;

            ripple.classList.add('active');

            // Turn text white
            if (genresContainer) genresContainer.classList.add('text-white');
            if (navbar) navbar.classList.add('text-white');

            currentCard = card;
        });

        card.addEventListener('mouseleave', () => {
            const rect = card.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            // Remove the colored ripple
            ripple.classList.remove('active');

            // Revert text color
            if (genresContainer) genresContainer.classList.remove('text-white');
            if (navbar) navbar.classList.remove('text-white');

            // Create a second ripple that spreads the original bg color
            const reverseRipple = document.createElement('div');
            reverseRipple.classList.add('bg-ripple', 'bg-ripple-reverse');
            reverseRipple.style.left = x + 'px';
            reverseRipple.style.top = y + 'px';
            reverseRipple.style.backgroundColor = '#F0EDE5';
document.querySelector('.homepage-genre').appendChild(reverseRipple);

            // Trigger the animation
            void reverseRipple.offsetWidth;
            reverseRipple.classList.add('active');

            // Remove after animation completes
            reverseRipple.addEventListener('transitionend', () => {
                reverseRipple.remove();
            });

            currentCard = null;
        });
    });
}
const container = document.getElementById("books-container");

if (container) {
  Books.forEach(book => {
    const card = document.createElement("div");
    card.classList.add("book-listing");

    // We encode the title so spaces and special characters don't break the URL
    const bookParam = encodeURIComponent(book.title);

    card.innerHTML = `
      <a href="Product.html?title=${bookParam}" class="book-link">
        <img class="book-cover" src="${book.image}" alt="${book.title}">
      </a>
      <button class="add-to-cart" type="button">Add to cart</button>
      <p class="book-details">${book.genre} | ${book.year}</p>
      <a href="Product.html?title=${bookParam}" class="book-link">
        <h3 class="book-title">${book.title}</h3>
      </a>
      <p class="book-author">${book.author}</p>
    `;

    container.appendChild(card);
  });
}
/*PRODUCT PAGE*/
    document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const bookTitle = params.get('title');

    if (bookTitle && typeof Books !== 'undefined') {
        const selectedBook = Books.find(b => b.title === bookTitle);
 
        if (selectedBook) {
            document.getElementById('main-title').innerText = selectedBook.title;
            document.getElementById('main-author').innerText = selectedBook.author;
            document.getElementById('main-price').innerText = `$${selectedBook.price}`;
            document.getElementById('main-description').innerText = selectedBook.description;
            document.getElementById('main-quote').innerText = `"${selectedBook.quote}"`;
            document.getElementById('main-image').src = selectedBook.image;
            document.getElementById('main-image').alt = selectedBook.title;
            document.getElementById('main-year').innerText = selectedBook.year;
            document.getElementById('main-pages').innerText = `${selectedBook.pages} pages`;
            document.getElementById('main-language').innerText = selectedBook.language; 
            document.getElementById('main-ISBN').innerText = selectedBook.ISBN;

            // --- Availability Logic ---
            const availabilityEl = document.getElementById('main-availability');
            if (selectedBook.available) {
                availabilityEl.innerText = "In Stock";
                availabilityEl.style.color = "#24d31e"; // Green
            } else {
                availabilityEl.innerText = "Out of Stock";
                availabilityEl.style.color = "#d32424"; // Red
            }
            
        } else {
            document.querySelector('.product-page').innerHTML = "<h1>Book not found</h1>";
        }
    }
});
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

        const itemCard = document.createElement("div");
        itemCard.className = "order-item";

        itemCard.innerHTML = `
            <img src="${item.image}" alt="${item.title}">
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
function handleNavbarColorInversion() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    // Add any dark sections you want the navbar to invert over here
    const darkSections = document.querySelectorAll('.site-footer, .book-bg');
    const navRect = navbar.getBoundingClientRect();
    
    let isDark = false;
    
    darkSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        // Check if navbar vertically overlaps the dark section
        if (rect.top < navRect.bottom - 10 && rect.bottom > navRect.top + 10) {
            isDark = true;
        }
    });

    // We shouldn't interfere if the user is hovering a specific genre card that relies on it manually
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

        const item = document.createElement('div');
        item.className = 'cart-item';
        item.innerHTML = `
            <img class="cart-item-img" src="${book.image}" alt="${book.title}">
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
            window.location.href = 'Checkout.html';
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
                return `
                    <div class="checkout-order-item">
                        <img class="checkout-book-cover"
                             src="${item.image || ''}"
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
        if (totalEl)    totalEl.textContent    = `€${(subtotal + shipping).toFixed(2)}`;
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

        window.location.href = 'ordersucces.html';
    });
});



/*-----sign-in-----*/
 

function login(){

let email =document.getElementById("email").value;
let password =document.getElementById("password").value;
let pattern =/^(?=.*[A-Z])(?=.*\d).+$/;
let length=6;
message.innerText = "";
    message.className = "form-message";

if(email=="" || password==""){
message.innerText = "Some fields are not filled!";
message.classList.add("error");
return false;
}
else if(!email.includes(".") || !email.includes("@"))
{
message.innerText = "invalid email";
        message.classList.add("error");
        return false;

}
else if(password.length<length)
{
    message.innertext="password must me atleast 6 characters!"
message.classList.add("error");
return false;
}
else if(!pattern.test(password))
{
    message.innerText = "Password must contain a capital letter and a number";
           message.classList.add("error");
           return false;
}

message.innerText = "Login successful ";
    message.classList.add("success");

    return true;


}



/* -----------sign-up--------------*/


 let name2 = document.getElementById("signup-name").value.trim();
    let email2 = document.getElementById("signup-email").value.trim();
    let password2 = document.getElementById("signup-password").value.trim();
    let confirm = document.getElementById("signup-confirm").value.trim();

    let message = document.getElementById("signup-message");
    message.innerText = "";
    message.className = "signup-form-message";

    // One big if statement checking combinations
    if (!name2 && email2 && password && confirm) {
        message.innerText = "Please enter your full name!";
        message.classList.add("signup-error");
        return false;
    } else if (name2 && !email2 && password && confirm) {
        message.innerText = "Please enter your email!";
        message.classList.add("signup-error");
        return false;
    } else if (name2 && email2 && !password2 && confirm) {
        message.innerText = "Please enter your password!";
        message.classList.add("signup-error");
        return false;
    } else if (name2 && email2 && password2 && !confirm) {
        message.innerText = "Please re-enter your password!";
        message.classList.add("signup-error");
        return false;
    } else if (!name2 && !email2 && password2 && confirm) {
        message.innerText = "Please enter your name and email!";
        message.classList.add("signup-error");
        return false;
    } else if (!name2 && email2 && !password2 && confirm) {
        message.innerText = "Please enter your name and password!";
        message.classList.add("signup-error");
        return false;
    }

    
    if (password2 && confirm && password2 !== confirm) {
        message.innerText = "Passwords do not match!";
        message.classList.add("signup-error");
        return false;
    }

   
    if (email2 && (!email2.includes("@") || !email2.includes("."))) {
        message.innerText = "Please enter a valid email!";
        message.classList.add("signup-error");
        return false;
    }

    
    if (password2 && password2.length < 6) {
        message.innerText = "Password must be at least 6 characters!";
        message.classList.add("signup-error");
        return false;
    }

    // Success
    message.innerText = "Account created successfully!";
    message.classList.add("signup-success");
    return false; // prevent form submission



function toggleSignupPassword() {
    let input = document.getElementById("signup-password");
    input.type = input.type === "password" ? "text" : "password";
}

function toggleSignupConfirm() {
    let input = document.getElementById("signup-confirm");
    input.type = input.type === "password" ? "text" : "password";
}






/*----------Admin-------------*/


function toggleAdminPassword() {
    let input = document.getElementById("admin-password");
    input.type = input.type==="password" ? "text" : "password";
}

function adminSigninUser() {
    let email = document.getElementById("admin-email").value.trim();
    let password = document.getElementById("admin-password").value.trim();

    let errorEmail = document.getElementById("admin-error-email");
    let errorPassword = document.getElementById("admin-error-password");

    // reset errors
    errorEmail.innerText="";
    errorPassword.innerText="";

    let hasError=false;

    if(!email){
        errorEmail.innerText="Please enter your email!";
        hasError=true;
    }
    else if(!email.includes("@") || !email.includes(".")){
        errorEmail.innerText="Please enter a valid email!";
        hasError=true;
    }

    if(!password){
        errorPassword.innerText="Please enter your password!";
        hasError=true;
    }

    if(hasError) return false;

    alert("Admin signed in successfully!");
    return false; // prevent reload
}











// Automatically set the active nav link based on current page
document.addEventListener('DOMContentLoaded', () => {
    let currentPath = window.location.pathname.split('/').pop() || 'Home.html';

    // Highlight Browse tab if browsing inside products or authors
    if (['Product.html', 'Authors.html'].includes(currentPath)) {
        currentPath = 'Genres.html';
    } 

    // Add active styling
    const navLinks = document.querySelectorAll('.navrbar-text li a, .navbar ul li a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('active-link');
        }
    });
});







// AUTHOR PAGE


window.addEventListener('scroll', function() {
    const scrollPos = window.scrollY;
    const heroContent = document.querySelector('.authorPhoto-content');
    const heroBg = document.querySelector('.authorPhoto-bg');

    // 1. Fade out the text ("Amr Diab") as you scroll
    let opacity = 1 - (scrollPos / 300);
    if (opacity >= 0) {
        heroContent.style.opacity = opacity;
    }

    // 2. Subtle Zoom/Parallax effect on the photo
    heroBg.style.transform = 'scale(' + (1 + scrollPos / 2000) + ')';
});





window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const authorId = urlParams.get('id');

    if (authorId && authorData[authorId]) {
        const data = authorData[authorId];

        // 1. Update Banner & About Sections
        document.getElementById('author-name-heading').textContent = data.name;
        document.getElementById('author-stats-sub').textContent = data.stats;
        document.getElementById('about-title').textContent = data.aboutTitle;
        document.getElementById('about-description').textContent = data.aboutText;
        
        const banner = document.getElementById('dynamic-banner');
        if (banner) {
            banner.style.backgroundImage = `linear-gradient(to top, rgba(0,0,0,0.8), transparent), url('${data.bannerImg}')`;
        }
        
        const aboutImg = document.getElementById('about-img');
        if (aboutImg) aboutImg.src = data.profileImg;

        // 2. Update Books Row with your EXACT CSS Structure
        const bookRow = document.getElementById('books-container');
if (bookRow) {
    bookRow.innerHTML = ''; // Clears static placeholders
    
    data.books.forEach(book => {
        // We use backticks (`) to create the exact HTML structure from your CSS
        const bookHTML = `
            <div class="book-container">
                <img src="${book.cover}" class="book-img" alt="${book.title}">
                
                <div class="book-infosss">
                    <div class="book-name">${book.title}</div>
                    
                    <div class="rating-row">
                        <span class="star-icon">★</span>
                        <span class="rating-num">${book.rating}</span>
                        <span class="review-count">· ${book.reviews} reviews</span>
                    </div>
                </div>
            </div>
        `;
        bookRow.insertAdjacentHTML('beforeend', bookHTML);
    });
}
    }
});





// HOME PAGE 


/*  THE BUTTON JS  */
 const track = document.getElementById('track');
const slideLeft = document.getElementById('slideLeft');
const slideRight = document.getElementById('slideRight');

const scrollAmount = 300; // Adjust to match your card width + gap

function updateButtons() {
    // Check if we are at the very start (Left)
    if (track.scrollLeft <= 0) {
        slideLeft.classList.add('disabled');
    } else {
        slideLeft.classList.remove('disabled');
    }

    // Check if we are at the very end (Right)
    // scrollWidth is the total length, clientWidth is what you see
    if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 1) {
        slideRight.classList.add('disabled');
    } else {
        slideRight.classList.remove('disabled');
    }
}

slideLeft.addEventListener('click', () => {
    track.scrollBy({ left: -300, behavior: 'smooth' });
});

slideRight.addEventListener('click', () => {
    track.scrollBy({ left: 300, behavior: 'smooth' });
});

// Listen for the scroll to finish to update buttons
track.addEventListener('scroll', updateButtons);

// Run once on page load to set initial state
updateButtons();







   
document.addEventListener("DOMContentLoaded", function () {
  const observerOptions = {
    threshold: 0.15 // Trigger when 15% of the element is visible
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        // Optional: stop observing once it has appeared
        // observer.unobserve(entry.target); 
      }
    });
  }, observerOptions);

  // Select all elements with the 'reveal' class and start watching them
  const hiddenElements = document.querySelectorAll(".reveal");
  hiddenElements.forEach((el) => observer.observe(el));
});










 /* THE FOOTER LINKS*/


const footerLinks = document.querySelectorAll('.footer-link');

footerLinks.forEach(link => {
    link.addEventListener('click', function(e) {
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
    
