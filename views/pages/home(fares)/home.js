// HOME PAGE 

function getProductUrlFromHome(title) {
    return `./pages/product(Marwan)/product.html?title=${encodeURIComponent(title)}`;
}

function normalizeAssetToken(value) {
    const fileName = String(value || '').split('/').pop().split('\\').pop();
    return fileName.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findBookByImageSrc(src) {
    if (!Array.isArray(Books)) return null;
    const token = normalizeAssetToken(src);
    return Books.find((book) => normalizeAssetToken(book.image) === token) || null;
}

function updateHomeStaticBookLinks() {
    if (!Array.isArray(Books)) return;
    const carouselAnchors = document.querySelectorAll('.Images-carousole a');

    carouselAnchors.forEach((anchor) => {
        const image = anchor.querySelector('img');
        if (!image) return;

        const matchedBook = findBookByImageSrc(image.getAttribute('src'));
        if (!matchedBook) return;

        anchor.href = getProductUrlFromHome(matchedBook.title);
    });
}


/*  THE BUTTON JS  */
const track = document.getElementById('track');
const slideLeft = document.getElementById('slideLeft');
const slideRight = document.getElementById('slideRight');

const scrollAmount = 300; // Adjust to match your card width + gap

function updateButtons() {
    if (!track || !slideLeft || !slideRight) return;

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

if (track && slideLeft && slideRight) {
    slideLeft.addEventListener('click', () => {
        track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    slideRight.addEventListener('click', () => {
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    // Listen for the scroll to finish to update buttons
    track.addEventListener('scroll', updateButtons);

    // Run once on page load to set initial state
    updateButtons();
}




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

    // Handle "Book of the Season" add to cart button
    const seasonAddBtn = document.getElementById('seasonAddToCart');
    if (seasonAddBtn) {
        seasonAddBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            // Get book data from button attributes
            const book = {
                title: this.getAttribute('data-title'),
                author: this.getAttribute('data-author'),
                price: this.getAttribute('data-price'),
                image: this.getAttribute('data-image'),
                qty: 1
            };

            // Add to cart in localStorage
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const existing = cart.find(item => item.title === book.title);
            if (existing) {
                existing.qty = (existing.qty || 1) + 1;
            } else {
                cart.push(book);
            }
            localStorage.setItem('cart', JSON.stringify(cart));

            // Trigger fly-to-cart animation from the book cover
            const bookCover = document.querySelector('.season-book-cover img');
            if (bookCover) {
                flyToCart(bookCover);
            }

            // Show button feedback
            const originalText = this.textContent;
            this.textContent = 'Added ✓';
            this.style.background = '#5a4232';
            setTimeout(() => {
                this.textContent = originalText;
                this.style.background = '';
            }, 1200);
        });
    }
});






// Book Cards Expanding Carousel JavaScript(in new realese section)

class BookCardsSlider {
    constructor() {
        this.container = null;
        this.cards = [];
        this.data = [];
        this.init();
    }

    async init() {
        await this.loadData();
        this.render();
        // No event listeners needed for hover-based expansion
    }

    async loadData() {
        // Use the Books array from data.js
        if (typeof Books !== 'undefined') {
            // Take first 6 books for the carousel
            this.data = Books.slice(0, 6).map((book, index) => ({
                id: index + 1,
                title: book.title,
                author: book.author,
                genre: book.genre,
                year: book.year,
                image: book.image,
                price: book.price,
                available: typeof book.stock === 'number' ? book.stock > 0 : Boolean(book.available),
                number: `${String(index + 1).padStart(2, '0')}.`
            }));
        } else {
            console.error('Books data not found. Make sure data.js is loaded.');
        }
    }

    render() {
        const container = document.getElementById('font-cards-container');
        if (!container) return;

        this.container = container;
        
        // Create the cards list
        const cardsList = document.createElement('ul');
        cardsList.className = 'font-cards-container';
        
        this.data.forEach((cardData, index) => {
            const card = this.createCard(cardData, index);
            cardsList.appendChild(card);
        });
        
        container.appendChild(cardsList);
        this.cards = cardsList.querySelectorAll('.font-card');
    }

    createCard(data, index) {
        const card = document.createElement('li');
        card.className = 'font-card';
        card.dataset.cardId = data.id;
        
        // Create the link wrapper
        const link = document.createElement('a');
        link.href = getProductUrlFromHome(data.title);
        link.className = 'card-link';
        link.style.textDecoration = 'none';
        link.style.color = 'inherit';
        link.style.display = 'flex';
        link.style.flexDirection = 'column';
        link.style.width = '100%';
        link.style.height = '100%';
        
        link.innerHTML = `
            <div class="card-header">
                <span class="card-number">${data.number}</span>
                <span class="availability-badge ${data.available ? 'available' : 'unavailable'}">
                    ${data.available ? 'Available' : 'Out of Stock'}
                </span>
            </div>
            
            <span class="genre-label">${data.genre}</span>
            
            <img src="${data.image}" alt="${data.title}" class="book-cover" loading="lazy">
            
            <div class="card-title-section">
                <span class="card-title">${data.title}</span>
                <span class="card-author">${data.author}</span>
            </div>
            
            <div class="card-price">${data.price}</div>
        `;
        
        card.appendChild(link);
        return card;
    }
}

// Initialize the book cards slider when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    updateHomeStaticBookLinks();
    // Wait a bit to ensure Books data is loaded
    setTimeout(() => {
        new BookCardsSlider();
    }, 100);
});
















// All Authors Page JavaScript

class AllAuthorsPage {
    constructor() {
        this.authorsData = {}; 
        this.authorsGrid = document.getElementById('authorsGrid');
        this.searchInput = document.getElementById('authorSearchInput');
        this.noResults = document.getElementById('noResults');

        // Start the loading process
        this.loadDataAndInit();
    }

    async loadDataAndInit() {
        try {
            // 1. Fetch data from your Express backend
            const response = await fetch('/api/authors');
            const data = await response.json();
            
            // 2. Store the data (Express returns an array, we'll keep it as is)
            this.authorsData = data;
            
            // 3. Initialize the UI
            this.init();
        } catch (error) {
            console.error("Error loading authors:", error);
        }
    }

    init() {
        this.renderAuthors();
        this.setupSearch();
    }

    // Render all authors to the grid
    renderAuthors(filteredAuthors = null) {
        const authors = filteredAuthors || this.authorsData;
        
        // Fade out current cards
        this.authorsGrid.style.opacity = '0';
        this.authorsGrid.style.transition = 'opacity 0.2s ease';
        
        setTimeout(() => {
            this.authorsGrid.innerHTML = '';

            const authorKeys = Object.keys(authors);
            
            if (authorKeys.length === 0) {
                this.showNoResults();
                return;
            }

            this.hideNoResults();

            authorKeys.forEach(key => {
                const author = authors[key];
                const authorCard = this.createAuthorCard(key, author);
                this.authorsGrid.appendChild(authorCard);
            });
            
            // Fade in new cards
            this.authorsGrid.style.opacity = '1';
            
            // Trigger reflow to restart animations
            void this.authorsGrid.offsetWidth;
        }, 200);
    }

    // Create individual author card
    createAuthorCard(authorId, author) {
        const card = document.createElement('div');
        card.className = 'author-grid-card';
        
        // Determine the correct image path
        let imagePath = author.profileImg;
        
        // If the path starts with ../../, it's already correct for the AllAuthors page
        // If not, we need to adjust it
        if (!imagePath.startsWith('../../')) {
            imagePath = '../../' + imagePath;
        }

        card.innerHTML = `
            <a href="../catalog(Marwan)/authors.html?id=${authorId}">
                <div class="author-grid-image" style="background-image: url('${imagePath}');">
                    <div class="author-grid-overlay">
                        <div class="author-grid-stats">
                            <div class="stats-line"></div>
                            <span class="stats-text">${author.books.length} BOOK${author.books.length !== 1 ? 'S' : ''}</span>
                        </div>
                        <div class="author-grid-info">
                            <h3 class="author-grid-name">${author.name}</h3>
                            <p class="author-grid-desc">${author.stats}</p>
                        </div>
                    </div>
                </div>
            </a>
        `;

        return card;
    }

    // Setup search functionality
    setupSearch() {
        let searchTimeout;
        
        this.searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            // Clear previous timeout
            clearTimeout(searchTimeout);
            
            // Add small delay for better UX
            searchTimeout = setTimeout(() => {
                if (searchTerm === '') {
                    this.renderAuthors();
                    return;
                }

                const filteredAuthors = this.filterAuthors(searchTerm);
                this.renderAuthors(filteredAuthors);
            }, 200);
        });
    }

    // Filter authors based on search term
    filterAuthors(searchTerm) {
        
      // If this.authorsData is an array from the backend:
    return this.authorsData.filter(author => {
        const name = author.name.toLowerCase();
        const stats = (author.stats || "").toLowerCase();
        return name.includes(searchTerm) || stats.includes(searchTerm);
    });

       
    }

    // Show no results message
    showNoResults() {
        this.noResults.style.display = 'block';
        this.authorsGrid.style.opacity = '1';
    }

    // Hide no results message
    hideNoResults() {
        this.noResults.style.display = 'none';
    }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AllAuthorsPage();
});

