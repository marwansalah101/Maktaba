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
            
            <div class="card-price">L${data.price}</div>
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

// ==================== ALL AUTHORS PAGE ====================

class AllAuthorsPage {
    constructor() {
        this.authorsData = [];
        this.authorsGrid = document.getElementById('authorsGrid');
        this.searchInput = document.getElementById('authorSearchInput');
        this.noResults = document.getElementById('noResults');
        
        if (this.authorsGrid) {
            this.loadAuthorsFromAPI();
        }
    }

    async loadAuthorsFromAPI() {
        try {
            // Show loading state
            this.showLoading();
            
            // Fetch authors from backend API
            const response = await fetch('/api/authors');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const authors = await response.json();
            this.authorsData = authors;
            
            // Initialize the page
            this.init();
            
        } catch (error) {
            console.error('Failed to load authors:', error);
            this.showError('Failed to load authors: ' + error.message);
        }
    }

    showLoading() {
        this.authorsGrid.innerHTML = '<div class="loading-message">Loading authors...</div>';
    }

    showError(message) {
        this.authorsGrid.innerHTML = `<div class="error-message">${message}</div>`;
    }

    init() {
        this.renderAuthors();
        this.setupSearch();
    }

    // Render all authors to the grid
    renderAuthors(filteredAuthors = null) {
        const authors = filteredAuthors || this.authorsData;
        
        // Quick fade out
        this.authorsGrid.style.opacity = '0';
        
        setTimeout(() => {
            this.authorsGrid.innerHTML = '';

            if (!Array.isArray(authors) || authors.length === 0) {
                this.showNoResults();
                return;
            }

            this.hideNoResults();

            authors.forEach((author, index) => {
                const authorCard = this.createAuthorCard(author, index);
                this.authorsGrid.appendChild(authorCard);
            });
            
            // Quick fade in
            this.authorsGrid.style.opacity = '1';
            
            // Trigger reflow to restart animations
            void this.authorsGrid.offsetWidth;
        }, 150);
    }

    // Create individual author card
    createAuthorCard(author, index) {
        const card = document.createElement('div');
        card.className = 'author-grid-card';
        
        // Use author slug or ID for navigation
        const authorIdentifier = author.slug || author._id;
        
        // Handle image path - use profileImg from database or fallback
        let imagePath = author.profileImg || '../../resources/Authors/default-author.jpg';
        
        // Ensure proper path for the AllAuthors page
        if (!imagePath.startsWith('http') && !imagePath.startsWith('../../')) {
            imagePath = '../../' + imagePath.replace(/^\.\//, '');
        }

        // Get book count from populated books or default to 0
        const bookCount = author.books ? author.books.length : 0;

        card.innerHTML = `
            <a href="../catalog(Marwan)/authors.html?slug=${authorIdentifier}">
                <div class="author-grid-image" style="background-image: url('${imagePath}');">
                    <div class="author-grid-overlay">
                        <div class="author-grid-stats">
                            <div class="stats-line"></div>
                            <span class="stats-text">${bookCount} BOOK${bookCount !== 1 ? 'S' : ''}</span>
                        </div>
                        <div class="author-grid-info">
                            <h3 class="author-grid-name">${author.name}</h3>
                            <p class="author-grid-desc">${author.stats || 'Author'}</p>
                        </div>
                    </div>
                </div>
            </a>
        `;

        return card;
    }

    // Setup search functionality
    setupSearch() {
        if (!this.searchInput) return;
        
        let searchTimeout;
        
        this.searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            // Clear previous timeout
            clearTimeout(searchTimeout);
            
            // Faster debounce for snappier response
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
        return this.authorsData.filter(author => {
            const authorName = (author.name || '').toLowerCase();
            const authorStats = (author.stats || '').toLowerCase();
            const aboutText = (author.aboutText || '').toLowerCase();
            
            return authorName.includes(searchTerm) || 
                   authorStats.includes(searchTerm) || 
                   aboutText.includes(searchTerm);
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

