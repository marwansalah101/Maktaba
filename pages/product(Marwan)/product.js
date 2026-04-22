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

        } else {
            document.querySelector('.product-page').innerHTML = "<h1>Book not found</h1>";
        }
    }
});

