// GENRE PAGE
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
/// COLLECTION PAGE
const container = document.getElementById("books-container");

// --- DYNAMIC RENDERING OF BOOKS ---
// This function creates HTML elements for every book object in the provided array.
// It maps the properties (cover image, title, author, etc.) to the respective card areas.
function renderBooks(booksToRender) {
    if (!container) return;
    container.innerHTML = '';
    
    if (booksToRender.length === 0) {
        container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; font-size: 1.2rem;">No books found.</p>';
        return;
    }

    booksToRender.forEach(book => {
        const card = document.createElement("div");
        card.classList.add("book-listing");

        // We encode the title so spaces and special characters don't break the URL
        const bookParam = encodeURIComponent(book.title);
        const basePath = window.location.pathname.includes('/pages/') ? '../../' : './';

        card.innerHTML = `
      <a href="${basePath}pages/product(Marwan)/product.html?title=${bookParam}" class="book-link">
        <img class="book-cover" src="${basePath}${book.image}" alt="${book.title}">
      </a>
      <button class="add-to-cart" type="button">Add to cart</button>
      <p class="book-details">${book.genre} | ${book.year}</p>
      <a href="${basePath}pages/product(Marwan)/product.html?title=${bookParam}" class="book-link">
        <h3 class="book-title">${book.title}</h3>
      </a>
      <a href="#" class="book-author" style="text-decoration:none; cursor:pointer;">${book.author}</a>
    `;

        // --- ADD TO CART & BAG ANIMATION LOGIC ---
        // Attaches a click event listener to the "Add to cart" button for each book.
        // Creates a floating "+1" tag animation over the navbar shopping bag icon
        // and safely stores the user's selected book in the localStorage 'cart' array.
        const addToCartBtn = card.querySelector('.add-to-cart');
        addToCartBtn.addEventListener('click', (e) => {
            // Cart animation logic
            const bagIcon = document.querySelector('.navbar-icons .material-symbols-outlined');
            if (bagIcon) {
                const plusOne = document.createElement('div');
                plusOne.textContent = '+1';
                plusOne.style.position = 'absolute';
                plusOne.style.color = '#fff';
                plusOne.style.backgroundColor = '#d32f2f';
                plusOne.style.borderRadius = '50%';
                plusOne.style.padding = '2px 6px';
                plusOne.style.fontSize = '12px';
                plusOne.style.fontWeight = 'bold';
                plusOne.style.zIndex = '1000';
                plusOne.style.pointerEvents = 'none';
                
                // Get bag icon position
                const rect = bagIcon.getBoundingClientRect();
                plusOne.style.left = (rect.left + window.scrollX) + 'px';
                plusOne.style.top = (rect.top + window.scrollY - 10) + 'px';
                
                document.body.appendChild(plusOne);
                
                // Animate
                let start = null;
                function animate(timestamp) {
                    if (!start) start = timestamp;
                    const progress = timestamp - start;
                    const shiftY = Math.min(progress / 5, 40); // Move up to 40px
                    plusOne.style.top = (rect.top + window.scrollY - 10 - shiftY) + 'px';
                    plusOne.style.opacity = 1 - (progress / 1000); // Fade out over 1s
                    
                    if (progress < 1000) {
                        requestAnimationFrame(animate);
                    } else {
                        plusOne.remove();
                    }
                }
                requestAnimationFrame(animate);
                
                // Actual add to cart logic would go here
                let cart = JSON.parse(localStorage.getItem('cart') || '[]');
                cart.push(book);
                localStorage.setItem('cart', JSON.stringify(cart));
            }
        });

        container.appendChild(card);
    });
}

if (container) {
    renderBooks(Books);
}

// --- FILTER MENU TOGGLE ---
// Opens and closes the expandable filter box where users can select genres.
const btn = document.getElementById('toggleBtn');
const box = document.getElementById('expandBox');

if (btn && box) {
    btn.addEventListener('click', () => {
        box.classList.toggle('open');
        console.log("Filter menu toggled!");
    });
}

// --- GENRE FILTERING (CRITERIA) ---
// Captures clicks on genres inside the filter box and filters the 'Books' array
// based on the selected genre. Then it overrides rendering using only the matched books.
const filterLinks = document.querySelectorAll('#expandBox .line a');
if (filterLinks.length > 0) {
    filterLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const genre = e.target.textContent.trim().toLowerCase();
            const filteredBooks = Books.filter(book => book.genre.toLowerCase() === genre);
            renderBooks(filteredBooks);
        });
    });
}

// --- DYNAMIC SEARCH FUNCTIONALITY ---
// Enables users to query books instantly based on title, author, or genre criteria.
// It watches both 'click' action on the designated search button and live 'input' typing events
// upon the search box so updates fetch synchronously.
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.querySelector('.search-input');

if (searchBtn && searchInput) {
    // Search on button click
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim().toLowerCase();
        const filteredBooks = Books.filter(book => 
            book.title.toLowerCase().includes(query) || 
            book.author.toLowerCase().includes(query) ||
            book.genre.toLowerCase().includes(query)
        );
        renderBooks(filteredBooks);
    });

    // Also support typing
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        const filteredBooks = Books.filter(book => 
            book.title.toLowerCase().includes(query) || 
            book.author.toLowerCase().includes(query) ||
            book.genre.toLowerCase().includes(query)
        );
        renderBooks(filteredBooks);
    });
}
const BookSearchBtn = document.getElementById('BookSearchBtn');








// Author page scroll effects
window.addEventListener('scroll', function () {
    const scrollPos = window.scrollY;
    const heroContent = document.querySelector('.authorPhoto-content');
    const heroBg = document.querySelector('.authorPhoto-bg');

    // 1. Fade out the text ("Amr Diab") as you scroll
    if (heroContent) {
        let opacity = 1 - (scrollPos / 300);
        heroContent.style.opacity = opacity >= 0 ? opacity : 0;
    }

    // 2. Subtle Zoom/Parallax effect on the photo
    if (heroBg) {
        heroBg.style.transform = 'scale(' + (1 + scrollPos / 2000) + ')';
    }
});






// Author page 
window.addEventListener('load', function () {
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
