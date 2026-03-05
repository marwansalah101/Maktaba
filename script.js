// 1. Grab the elements
const btn = document.getElementById('toggleBtn');
const box = document.getElementById('expandBox');

// 2. Only run if BOTH exist on the current page
if (btn && box) {
    btn.addEventListener('click', () => {
        box.classList.toggle('open');
        console.log("Filter menu toggled!");
    });
}
const modal = document.getElementById("bookModal");
const closeBtn = document.querySelector(".close-button");

if (modal && closeBtn) {
    // Select all your book cards
    document.querySelectorAll('.book-card').forEach(card => {
        card.addEventListener('click', () => {
            // 1. Get the data from the card
            const title = card.querySelector('h3').innerText; 
            const author = card.querySelector('p').innerText;
            const details = card.querySelector('h4').innerText; // If you have a hidden details element
            const imageSrc = card.querySelector('img').src; // Grabs the cover

            // 2. Inject the data into the modal
            document.getElementById('modal-title').innerText = title;
            document.getElementById('modal-author').innerText = author;
            document.getElementById('modal-details').innerText = details;
            document.getElementById('modal-image').src = imageSrc; // Sets the modal image

            // 3. Show and animate the modal
            modal.classList.add('show');
            setTimeout(() => {
                document.querySelector('.modal-content').classList.add('is-visible');
            }, 10);
        });
    });

    // Close when clicking 'X'
    closeBtn.onclick = () => modal.classList.remove('show');

    // Close if clicking outside the box
    window.onclick = (event) => {
        if (event.target == modal) modal.classList.remove('show');
    };
}

// ── Organic Ripple Background on Genre Card Hover ──
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