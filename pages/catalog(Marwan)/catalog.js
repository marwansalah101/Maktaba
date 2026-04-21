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
