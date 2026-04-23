// HOME PAGE 


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
                available: book.available,
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
        link.href = './pages/product(Marwan)/product.html';
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
    // Wait a bit to ensure Books data is loaded
    setTimeout(() => {
        new BookCardsSlider();
    }, 100);
});