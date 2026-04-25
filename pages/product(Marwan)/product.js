document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const bookTitle = params.get('title');

    function addBookToCart(book) {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItem = cart.find((item) => item.title === book.title);

        if (existingItem) {
            existingItem.qty = (existingItem.qty || 1) + 1;
        } else {
            cart.push({ ...book, qty: 1 });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
    }

    if (bookTitle && typeof Books !== 'undefined') {
        const selectedBook = Books.find(b => b.title === bookTitle);

        if (selectedBook) {
            document.getElementById('main-title').innerText = selectedBook.title;
            document.getElementById('main-author').innerText = selectedBook.author;
            document.getElementById('main-price').innerText = `$${selectedBook.price}`;
            document.getElementById('main-genre').innerText = selectedBook.genre;
            document.getElementById('main-description').innerText = selectedBook.description;
            document.getElementById('main-quote').innerText = `"${selectedBook.quote}"`;

            const basePath = window.location.pathname.includes('/pages/') ? '../../' : './';
            document.getElementById('main-image').src = basePath + selectedBook.image;
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

            const addToCartBtn = document.querySelector('.add-to-cart-btn');
            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', () => {
                    addBookToCart(selectedBook);
                    const basePath = window.location.pathname.includes('/pages/') ? '../../' : './';
                    window.location.href = `${basePath}pages/checkout(Rojeh)/add-to-cart.html`;
                });
            }

        } else {
            document.querySelector('.product-page').innerHTML = "<h1>Book not found</h1>";
        }
    }
});

