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
    const navbar = document.querySelector('.navbarb');
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
            reverseRipple.style.backgroundColor = getComputedStyle(document.body).backgroundColor;
            document.body.appendChild(reverseRipple);

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