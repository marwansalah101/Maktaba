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
